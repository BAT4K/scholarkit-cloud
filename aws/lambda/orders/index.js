// ══════════════════════════════════════════════════════════
// ScholarKit — Orders Lambda Handler
// ─────────────────────────────────────────────────────────
// Replaces: backend/controllers/orderController.js
//
// Routes:
//   POST /orders/checkout   → Place order (TransactWriteItems)
//   GET  /orders            → User's order history
//   GET  /orders/:id        → Single order details
//
// The checkout replaces the MySQL `PlaceOrder` stored
// procedure with a DynamoDB Transaction that atomically:
//   1. Creates the ORDER item
//   2. Creates ORDER_ITEM items (denormalised)
//   3. Decrements product stock (with condition guard)
//   4. Deletes all CART items
//   5. Publishes an email receipt via Amazon SNS  ← Phase 3
// ══════════════════════════════════════════════════════════

const { docClient } = require('../shared/dynamo');
const { requireAuth } = require('../shared/auth');
const { success, error, options } = require('../shared/response');
const { TABLE_NAME, keys, ENTITY_TYPES } = require('../shared/tableConfig');
const {
  GetCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqs = new SQSClient({});
const PRODUCT_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/1e3a8a?text=ScholarKit';

// ── Handler & Router ────────────────────────────────────

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  const path = (event.path || event.rawPath || '').replace(/\/+$/, '');

  try {
    const user = requireAuth(event);

    const segments = path.split('/').filter(Boolean);
    const ordersIdx = segments.indexOf('orders');
    if (ordersIdx === -1) return error('Route not found', 404);

    const sub = segments.slice(ordersIdx + 1);

    // POST /orders/checkout
    if (method === 'POST' && sub[0] === 'checkout') {
      return placeOrder(user);
    }

    // GET /orders
    if (method === 'GET' && sub.length === 0) {
      return getUserOrders(user);
    }

    // GET /orders/:id
    if (method === 'GET' && sub.length === 1) {
      return getOrderDetails(sub[0]);
    }

    return error('Route not found', 404);
  } catch (err) {
    console.error('Orders Lambda Error:', err);
    if (err.statusCode) return error(err.message, err.statusCode);
    return error('Internal server error', 500);
  }
};


// ═══════════════════════════════════════════════════════
// 1. PLACE ORDER (Atomic Checkout)
//    Replaces: MySQL Stored Procedure `PlaceOrder`
//    DynamoDB:  TransactWriteItems (ACID transaction)
//
//    Original MySQL procedure did:
//      START TRANSACTION
//        → Calculate subtotal (cart × product prices)
//        → Insert into orders
//        → Insert into order_items
//        → UPDATE products SET stock = stock - quantity
//        → DELETE FROM cart_items
//      COMMIT
//
//    DynamoDB TransactWriteItems does exactly the same,
//    with a ConditionExpression to prevent negative stock.
// ═══════════════════════════════════════════════════════

async function placeOrder(user) {
  // ── 1. Get cart items ──────────────────────────────
  const cartResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.userPK(user.id),
      ':prefix': keys.cartPrefix(),
    },
  }));

  const cartItems = cartResult.Items || [];
  if (cartItems.length === 0) {
    return error('Cannot checkout: Your cart is empty.', 400);
  }

  // ── 2. Fetch FRESH product data (matching MySQL JOIN behaviour) ──
  const productData = {};
  for (const ci of cartItems) {
    const p = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: keys.productPK(ci.productId), SK: keys.productSK() },
    }));
    if (!p.Item) {
      return error(`Product "${ci.productName}" is no longer available.`, 400);
    }
    productData[ci.productId] = p.Item;
  }

  // ── 3. Calculate totals (uses fresh prices, same as MySQL SP) ──
  let subtotal = 0;
  for (const ci of cartItems) {
    subtotal += productData[ci.productId].price * ci.quantity;
  }
  const shippingFee  = subtotal < 1000 ? 50 : 0;
  const totalAmount  = subtotal + shippingFee;

  // ── 4. Generate order ID & timestamp ──────────────
  const orderId  = Date.now();
  const createdAt = new Date().toISOString();

  // ── 5. Push to SQS for background processing ────────
  const queueUrl = process.env.SQS_QUEUE_URL;
  if (!queueUrl) {
    return error('Checkout failed: Order queue not configured.', 500);
  }

  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        user,
        cartItems,
        productData,
        subtotal,
        shippingFee,
        totalAmount,
        orderId,
        createdAt
      })
    }));

    return success({
      message: 'Order received and queued for processing.',
      orderId,
      status: 'queued'
    }, 202);
  } catch (sqsErr) {
    console.error('SQS Send Error:', sqsErr);
    return error('Checkout failed: Could not queue order.', 500);
  }
}


// ═══════════════════════════════════════════════════════
// 2. GET USER'S ORDER HISTORY
//    Replaces: orderController.getUserOrders
//    Original used MySQL JSON_ARRAYAGG to nest items.
//    DynamoDB: query orders + query items per order.
// ═══════════════════════════════════════════════════════

async function getUserOrders(user) {
  // 1. Get all orders for this user
  const ordersResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.userPK(user.id),
      ':prefix': keys.orderPrefix(),
    },
  }));

  // Sort by createdAt descending (SK sort may be lexically wrong for mixed ID formats)
  const orders = (ordersResult.Items || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // 1.5 Gather all product IDs from all order items to fetch missing images
  const allProductIds = new Set();
  const orderItemsMap = {};
  
  for (const order of orders) {
    const itemsResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk':     keys.orderItemPK(order.orderId),
        ':prefix': keys.orderItemPrefix(),
      },
    }));
    orderItemsMap[order.orderId] = itemsResult.Items || [];
    for (const item of (itemsResult.Items || [])) {
      if (!item.productImageUrl && item.productId) {
        allProductIds.add(item.productId);
      }
    }
  }

  const liveProductsMap = {};
  if (allProductIds.size > 0) {
    const { BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
    const keysToFetch = Array.from(allProductIds).map(id => ({
      PK: keys.productPK(id),
      SK: keys.productSK()
    }));
    
    // BatchGet can only fetch 100 items at a time, but this will be small
    const batchResult = await docClient.send(new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: keysToFetch.slice(0, 100)
        }
      }
    }));
    
    for (const p of (batchResult.Responses[TABLE_NAME] || [])) {
      liveProductsMap[p.productId] = {
        url:  p.imageUrl || null,
        name: p.name || null
      };
    }
  }

  // 2. Format the response
  const result = [];
  for (const order of orders) {
    const items = orderItemsMap[order.orderId];

    result.push({
      id:              order.orderId,
      total_amount:    order.totalAmount,
      status:          order.status,
      created_at:      order.createdAt,
      shipping_fee:    order.shippingFee,
      tracking_number: order.trackingNumber,
      items: items.map((i) => {
        // Only use live product image if the name matches (prevents ID reuse issues)
        const liveImage = liveProductsMap[i.productId];
        const nameMatches = liveImage && liveImage.name === i.productName;
        
        return {
          name:      i.productName,
          image_url: i.productImageUrl || (nameMatches ? liveImage.url : null) || PRODUCT_PLACEHOLDER,
          quantity:  i.quantity,
          price:     i.priceAtPurchase,
        };
      }),
    });
  }

  return success(result);
}


// ═══════════════════════════════════════════════════════
// 3. GET SINGLE ORDER DETAILS
//    Replaces: orderController.getOrderDetails
//    DynamoDB:  Query — PK=ORDER#id, SK begins_with ITEM#
// ═══════════════════════════════════════════════════════

async function getOrderDetails(id) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.orderItemPK(id),
      ':prefix': keys.orderItemPrefix(),
    },
  }));

  if (!result.Items?.length) {
    return error('Order not found', 404);
  }

  const items = result.Items || [];
  
  // 1. Gather product IDs for items with missing images
  const allProductIds = new Set();
  for (const item of items) {
    if (!item.productImageUrl && item.productId) {
      allProductIds.add(item.productId);
    }
  }

  // 2. Fetch live products for missing images
  const liveProductsMap = {};
  if (allProductIds.size > 0) {
    const { BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
    const keysToFetch = Array.from(allProductIds).map(id => ({
      PK: keys.productPK(id),
      SK: keys.productSK()
    }));
    
    const batchResult = await docClient.send(new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: keysToFetch.slice(0, 100)
        }
      }
    }));
    
    for (const p of (batchResult.Responses[TABLE_NAME] || [])) {
      liveProductsMap[p.productId] = {
        url:  p.imageUrl || null,
        name: p.name || null
      };
    }
  }

  return success(items.map((i) => {
    const liveImage = liveProductsMap[i.productId];
    const nameMatches = liveImage && liveImage.name === i.productName;

    return {
      id:                i.productId,
      quantity:          i.quantity,
      price_at_purchase: i.priceAtPurchase,
      name:              i.productName,
      category:          i.productCategory,
      image_url:         i.productImageUrl || (nameMatches ? liveImage.url : null) || PRODUCT_PLACEHOLDER,
    };
  }));
}
