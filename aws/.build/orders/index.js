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

const { docClient } = require('./shared/dynamo');
const { requireAuth } = require('./shared/auth');
const { success, error, options } = require('./shared/response');
const { TABLE_NAME, keys, ENTITY_TYPES } = require('./shared/tableConfig');
const {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({});
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

  // ── 5. Get user info for denormalisation ───────────
  const userResult = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.userPK(user.id), SK: keys.userSK() },
  }));
  const userName  = userResult.Item?.name  || user.name  || '';
  const userEmail = userResult.Item?.email || user.email || '';

  // ── 6. Build the atomic transaction ───────────────
  const transactItems = [];

  // 6a. CREATE ORDER ITEM (under user's partition)
  transactItems.push({
    Put: {
      TableName: TABLE_NAME,
      Item: {
        PK:         keys.userPK(user.id),
        SK:         keys.orderSK(orderId),
        GSI1PK:     keys.allOrdersGSI(),
        GSI1SK:     keys.orderGSI1SK(createdAt, orderId),
        entityType: ENTITY_TYPES.ORDER,
        orderId,
        userId:     user.id,
        totalAmount,
        status:     'Paid',
        createdAt,
        shippingFee,
        trackingNumber: null,
        userName,
        userEmail,
      },
    },
  });

  for (const ci of cartItems) {
    const product = productData[ci.productId];

    // 6b. CREATE ORDER LINE ITEM (denormalised with product info)
    transactItems.push({
      Put: {
        TableName: TABLE_NAME,
        Item: {
          PK:         keys.orderItemPK(orderId),
          SK:         `ITEM#${ci.productId}#${ci.size}`,
          entityType: ENTITY_TYPES.ORDER_ITEM,
          orderId,
          productId:       ci.productId,
          quantity:        ci.quantity,
          priceAtPurchase: product.price,
          productName:     product.name,
          productCategory: product.category || null,
          productImageUrl: product.imageUrl || null,
        },
      },
    });

    // 6c. DECREMENT PRODUCT STOCK (with guard against negative)
    transactItems.push({
      Update: {
        TableName: TABLE_NAME,
        Key: { PK: keys.productPK(ci.productId), SK: keys.productSK() },
        UpdateExpression: 'SET stock = stock - :qty',
        ConditionExpression: 'stock >= :qty',
        ExpressionAttributeValues: { ':qty': ci.quantity },
      },
    });

    // 6d. DELETE CART ITEM
    transactItems.push({
      Delete: {
        TableName: TABLE_NAME,
        Key: { PK: keys.userPK(user.id), SK: ci.SK },
      },
    });
  }

  // ── 7. Execute atomic transaction ─────────────────
  try {
    await docClient.send(new TransactWriteCommand({
      TransactItems: transactItems,
    }));
  } catch (err) {
    if (err.name === 'TransactionCanceledException') {
      // Check if a stock condition failed
      const reasons = err.CancellationReasons || [];
      const stockFail = reasons.some((r) => r.Code === 'ConditionalCheckFailed');
      if (stockFail) {
        return error('Insufficient stock for one or more items. Please update quantities.', 400);
      }
    }
    throw err;
  }

  // ── 8. Publish email receipt via Amazon SNS (Phase 3) ──
  try {
    await publishReceipt(
      orderId, createdAt, userName, userEmail,
      cartItems, productData, subtotal, shippingFee, totalAmount
    );
  } catch (snsErr) {
    // SNS failure should NOT fail the order — transaction already committed
    console.warn('SNS publish failed (order still succeeded):', snsErr.message);
  }

  return success({
    message: 'Order placed successfully via DynamoDB Transaction!',
    orderId,
  }, 201);
}


// ═══════════════════════════════════════════════════════
// SNS EMAIL RECEIPT (Phase 3)
// Publishes a formatted order confirmation to the
// ScholarKit-OrderReceipts SNS topic. Subscribed email
// addresses receive the receipt automatically.
// ═══════════════════════════════════════════════════════

async function publishReceipt(
  orderId, createdAt, userName, userEmail,
  cartItems, productData, subtotal, shippingFee, totalAmount
) {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) {
    console.log('SNS_TOPIC_ARN not set — skipping email receipt.');
    return;
  }

  // Build item lines
  const itemLines = cartItems.map((ci) => {
    const product = productData[ci.productId];
    const lineTotal = product.price * ci.quantity;
    return `  ${ci.quantity}x ${product.name.padEnd(30)} ₹${lineTotal.toFixed(2)}`;
  }).join('\n');

  const message = [
    '════════════════════════════════════════════',
    '  ScholarKit — Order Confirmation',
    '════════════════════════════════════════════',
    '',
    `  Order #${orderId}`,
    `  Date:     ${new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    `  Customer: ${userName} (${userEmail})`,
    '',
    '── Items ──────────────────────────────────',
    itemLines,
    '',
    '── Summary ────────────────────────────────',
    `  Subtotal:  ₹${subtotal.toFixed(2)}`,
    `  Shipping:  ₹${shippingFee.toFixed(2)}`,
    `  Total:     ₹${totalAmount.toFixed(2)}`,
    '',
    '  Status: Paid ✓',
    '',
    '  Thank you for shopping with ScholarKit!',
    '════════════════════════════════════════════',
  ].join('\n');

  await sns.send(new PublishCommand({
    TopicArn: topicArn,
    Subject:  `ScholarKit Order Confirmation #${orderId}`,
    Message:  message,
  }));

  console.log(`📧 Receipt published to SNS for order #${orderId}`);
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

  // 2. For each order, fetch its line items
  const result = [];
  for (const order of orders) {
    const itemsResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk':     keys.orderItemPK(order.orderId),
        ':prefix': keys.orderItemPrefix(),
      },
    }));

    result.push({
      id:              order.orderId,
      total_amount:    order.totalAmount,
      status:          order.status,
      created_at:      order.createdAt,
      shipping_fee:    order.shippingFee,
      tracking_number: order.trackingNumber,
      items: (itemsResult.Items || []).map((i) => ({
        name:      i.productName,
        image_url: i.productImageUrl || PRODUCT_PLACEHOLDER,
        quantity:  i.quantity,
        price:     i.priceAtPurchase,
      })),
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

  return success((result.Items || []).map((i) => ({
    id:                i.productId,
    quantity:          i.quantity,
    price_at_purchase: i.priceAtPurchase,
    name:              i.productName,
    category:          i.productCategory,
  })));
}
