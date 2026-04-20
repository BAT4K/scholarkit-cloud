// ══════════════════════════════════════════════════════════
// ScholarKit — SQS Order Worker
// ─────────────────────────────────────────────────────────
// This background worker processes orders from the SQS queue.
// It executes the ACID transaction to:
//   1. Create ORDER item
//   2. Create ORDER_ITEM items
//   3. Decrement product stock
//   4. Delete CART items
//   5. Publish SNS Receipt
// ══════════════════════════════════════════════════════════

const { docClient } = require('./shared/dynamo');
const { TABLE_NAME, keys, ENTITY_TYPES } = require('./shared/tableConfig');
const {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({});

exports.handler = async (event) => {
  console.log(`📥 Received SQS batch with ${event.Records.length} messages.`);

  for (const record of event.Records) {
    try {
      const orderPayload = JSON.parse(record.body);
      await processSingleOrder(orderPayload);
      console.log(`✅ Order ${orderPayload.orderId} processed successfully.`);
    } catch (err) {
      console.error(`❌ Failed to process order:`, err);
      // Throwing error here will cause SQS to retry based on visibility timeout
      throw err;
    }
  }
};

async function processSingleOrder(payload) {
  const { user, cartItems, productData, subtotal, shippingFee, totalAmount, orderId, createdAt } = payload;

  console.log(`⚙️ Processing Order #${orderId} for User ${user.email}`);

  // ── 1. Get user info for denormalisation (optional, could have been in payload) ──
  const userResult = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.userPK(user.id), SK: keys.userSK() },
  }));
  const userName  = userResult.Item?.name  || user.name  || 'Customer';
  const userEmail = userResult.Item?.email || user.email || '';

  // ── 2. Build the atomic transaction ─────────────────
  const transactItems = [];

  // 2a. CREATE ORDER ITEM
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
        status:     'Processing', // Initial status in async flow
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

    // 2b. CREATE ORDER LINE ITEM
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

    // 2c. DECREMENT PRODUCT STOCK
    transactItems.push({
      Update: {
        TableName: TABLE_NAME,
        Key: { PK: keys.productPK(ci.productId), SK: keys.productSK() },
        UpdateExpression: 'SET stock = stock - :qty',
        ConditionExpression: 'stock >= :qty',
        ExpressionAttributeValues: { ':qty': ci.quantity },
      },
    });

    // 2d. DELETE CART ITEM
    transactItems.push({
      Delete: {
        TableName: TABLE_NAME,
        Key: { PK: keys.userPK(user.id), SK: ci.SK },
      },
    });
  }

  // ── 3. Execute atomic transaction ─────────────────
  await docClient.send(new TransactWriteCommand({
    TransactItems: transactItems,
  }));

  // ── 4. Publish SNS Receipt (Phase 3) ────────────────
  try {
    await publishReceipt(
      orderId, createdAt, userName, userEmail,
      cartItems, productData, subtotal, shippingFee, totalAmount
    );
  } catch (snsErr) {
    console.warn('SNS publish failed (order still succeeded):', snsErr.message);
  }
}

async function publishReceipt(
  orderId, createdAt, userName, userEmail,
  cartItems, productData, subtotal, shippingFee, totalAmount
) {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) return;

  const date = new Date(createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemLines = cartItems.map((ci, idx) => {
    const product = productData[ci.productId];
    const lineTotal = product.price * ci.quantity;
    const num = String(idx + 1).padStart(2, ' ');
    const name = product.name.length > 28 ? product.name.substring(0, 25) + '...' : product.name;
    const sizeLabel = ci.size ? ` (${ci.size})` : '';
    return `  ${num}. ${(name + sizeLabel).padEnd(34)} ${ci.quantity} x ₹${product.price}  =  ₹${lineTotal.toFixed(2)}`;
  }).join('\n');

  const itemCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  const message = [
    '',
    '🎓 S C H O L A R K I T',
    '========================================',
    'ORDER PROCESSED! ✓',
    '========================================',
    '',
    `Hi ${userName},`,
    '',
    'Your queued order has been successfully processed.',
    '',
    'ORDER DETAILS',
    '----------------------------------------',
    `Order #:   ${orderId}`,
    `Date:      ${date}`,
    '----------------------------------------',
    '',
    'ITEMS ORDERED',
    '----------------------------------------',
    itemLines,
    '----------------------------------------',
    `TOTAL PAID:   ₹${totalAmount.toFixed(2)}`,
    '========================================',
    '',
    '📦 STATUS: Processing → Shipped Soon',
    '',
    'Thank you for your patience!',
    ''
  ].join('\n');

  await sns.send(new PublishCommand({
    TopicArn: topicArn,
    Subject:  `🎓 ScholarKit — Order Processed #${orderId}`,
    Message:  message,
  }));
}
