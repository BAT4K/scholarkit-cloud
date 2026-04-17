// ══════════════════════════════════════════════════════════
// ScholarKit — Admin & Analytics Lambda Handler
// ─────────────────────────────────────────────────────────
// Replaces: backend/controllers/adminController.js
//           backend/controllers/notificationController.js
//
// Routes:
//   GET   /admin/stats            → Dashboard statistics
//   GET   /admin/orders           → All orders (admin view)
//   PATCH /admin/orders/:id       → Update order status
//   GET   /admin/top-products     → Top products per school
//   GET   /admin/inventory-value  → Total inventory value
//   GET   /notifications          → Seller notifications
//
// MySQL View/Procedure Equivalents:
//   vw_top_products_per_school   → in-code aggregation
//   CalculateTotalInventoryValue → Scan + reduce
// ══════════════════════════════════════════════════════════

const { docClient } = require('../shared/dynamo');
const { requireAuth } = require('../shared/auth');
const { success, error, options } = require('../shared/response');
const { TABLE_NAME, GSI1_NAME, keys, ENTITY_TYPES } = require('../shared/tableConfig');
const {
  GetCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const isPrivileged = (u) => u?.role === 'admin' || u?.role === 'seller';

// ── Handler & Router ────────────────────────────────────

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  const path = (event.path || event.rawPath || '').replace(/\/+$/, '');

  try {
    const user = requireAuth(event);

    const segments = path.split('/').filter(Boolean);

    // ── /notifications ──
    if (segments.includes('notifications') && method === 'GET') {
      return getNotifications(user);
    }

    // ── /admin/... ──
    const adminIdx = segments.indexOf('admin');
    if (adminIdx === -1) return error('Route not found', 404);

    if (!isPrivileged(user)) return error('Access denied.', 403);

    const sub = segments.slice(adminIdx + 1);

    // GET /admin/stats
    if (sub[0] === 'stats' && method === 'GET') return getDashboardStats();

    // GET /admin/orders
    if (sub[0] === 'orders' && sub.length === 1 && method === 'GET') return getAllOrders();

    // PATCH /admin/orders/:id
    if (sub[0] === 'orders' && sub.length === 2 && (method === 'PATCH' || method === 'PUT')) {
      return updateOrderStatus(event, sub[1]);
    }

    // GET /admin/top-products
    if (sub[0] === 'top-products' && method === 'GET') return getTopProducts();

    // GET /admin/inventory-value
    if (sub[0] === 'inventory-value' && method === 'GET') return getInventoryValue();

    return error('Route not found', 404);
  } catch (err) {
    console.error('Admin Lambda Error:', err);
    if (err.statusCode) return error(err.message, err.statusCode);
    return error('Internal server error', 500);
  }
};


// ═══════════════════════════════════════════════════════
// 1. DASHBOARD STATS
//    Replaces: adminController.getDashboardStats
//    Original: 4 separate SQL COUNT/SUM queries
//    DynamoDB: Single Scan + in-code aggregation
// ═══════════════════════════════════════════════════════

async function getDashboardStats() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'entityType IN (:order, :user, :product)',
    ExpressionAttributeValues: {
      ':order':   ENTITY_TYPES.ORDER,
      ':user':    ENTITY_TYPES.USER,
      ':product': ENTITY_TYPES.PRODUCT,
    },
  }));

  let totalRevenue = 0, totalOrders = 0, totalUsers = 0, lowStockCount = 0;

  for (const item of (result.Items || [])) {
    switch (item.entityType) {
      case ENTITY_TYPES.ORDER:
        totalRevenue += item.totalAmount || 0;
        totalOrders++;
        break;
      case ENTITY_TYPES.USER:
        if (item.role === 'customer') totalUsers++;
        break;
      case ENTITY_TYPES.PRODUCT:
        if (item.stock < 10) lowStockCount++;
        break;
    }
  }

  return success({ totalRevenue, totalOrders, totalUsers, lowStockCount });
}


// ═══════════════════════════════════════════════════════
// 2. ALL ORDERS (Admin List)
//    Replaces: adminController.getAllOrders
//    Original: SELECT orders JOIN users
//    DynamoDB: GSI1 Query — ENTITY#ORDER (denormalised
//              with userName/userEmail, no JOIN needed)
// ═══════════════════════════════════════════════════════

async function getAllOrders() {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': keys.allOrdersGSI() },
    ScanIndexForward: false,  // Newest first
  }));

  return success((result.Items || []).map((o) => ({
    id:              o.orderId,
    total_amount:    o.totalAmount,
    status:          o.status,
    created_at:      o.createdAt,
    shipping_fee:    o.shippingFee,
    tracking_number: o.trackingNumber,
    user_name:       o.userName,
    user_email:      o.userEmail,
  })));
}


// ═══════════════════════════════════════════════════════
// 3. UPDATE ORDER STATUS
//    Replaces: adminController.updateOrderStatus
//    DynamoDB: GSI1 Query to find order → UpdateItem
//    Note: 'status' is a DynamoDB reserved word → uses #s
// ═══════════════════════════════════════════════════════

async function updateOrderStatus(event, orderId) {
  const body = JSON.parse(event.body || '{}');
  const { status, tracking_number } = body;

  if (!status) return error('Status is required.', 400);

  // Find the order via GSI1 (we need PK+SK to update)
  const findResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    FilterExpression: 'orderId = :oid',
    ExpressionAttributeValues: {
      ':pk':  keys.allOrdersGSI(),
      ':oid': Number(orderId),
    },
  }));

  if (!findResult.Items?.length) return error('Order not found', 404);

  const order = findResult.Items[0];

  // Build update expression
  const names  = { '#s': 'status' };
  const values = { ':s': status };
  const setClauses = ['#s = :s'];

  if (tracking_number !== undefined) {
    names['#tn']  = 'trackingNumber';
    values[':tn'] = tracking_number;
    setClauses.push('#tn = :tn');
  }

  const updated = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: order.PK, SK: order.SK },
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ExpressionAttributeNames:  names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));

  const u = updated.Attributes;
  return success({
    id:              u.orderId,
    user_id:         u.userId,
    total_amount:    u.totalAmount,
    status:          u.status,
    created_at:      u.createdAt,
    shipping_fee:    u.shippingFee,
    tracking_number: u.trackingNumber,
  });
}


// ═══════════════════════════════════════════════════════
// 4. TOP PRODUCTS PER SCHOOL (Analytics)
//    Replaces: MySQL view `vw_top_products_per_school`
//    Original used:  ROW_NUMBER() OVER (PARTITION BY ...)
//    DynamoDB: Scan order items → aggregate → rank in code
// ═══════════════════════════════════════════════════════

async function getTopProducts() {
  // 1. Scan all order items
  const oiResult = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :et',
    ExpressionAttributeValues: { ':et': ENTITY_TYPES.ORDER_ITEM },
  }));

  // 2. Aggregate total sold per product
  const productSales = {};
  for (const item of (oiResult.Items || [])) {
    const pid = String(item.productId);
    productSales[pid] = (productSales[pid] || 0) + item.quantity;
  }

  // 3. Fetch product detail + school names
  const products = {};
  const schoolNameMap = {};

  for (const pid of Object.keys(productSales)) {
    const p = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: keys.productPK(pid), SK: keys.productSK() },
    }));
    if (!p.Item) continue;
    products[pid] = p.Item;

    const sid = p.Item.schoolId;
    if (sid && !schoolNameMap[sid]) {
      const s = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: keys.schoolPK(sid), SK: keys.schoolSK() },
      }));
      if (s.Item) schoolNameMap[sid] = s.Item.name;
    }
  }

  // 4. Group by school → sort → rank (replicates window function)
  const bySchool = {};
  for (const [pid, totalSold] of Object.entries(productSales)) {
    const product = products[pid];
    if (!product) continue;
    const sid = product.schoolId;
    if (!bySchool[sid]) bySchool[sid] = [];
    bySchool[sid].push({
      school_name:  schoolNameMap[sid] || 'Unknown',
      product_name: product.name,
      total_sold:   totalSold,
    });
  }

  const results = [];
  for (const entries of Object.values(bySchool)) {
    entries.sort((a, b) => b.total_sold - a.total_sold);
    entries.forEach((entry, idx) => {
      if (idx < 3) results.push({ ...entry, sales_rank: idx + 1 });
    });
  }

  return success(results);
}


// ═══════════════════════════════════════════════════════
// 5. TOTAL INVENTORY VALUE
//    Replaces: MySQL Stored Procedure with CURSOR
//              `CalculateTotalInventoryValue`
//    Original iterated every row with a cursor.
//    DynamoDB: Scan products → Array.reduce  (one line!)
// ═══════════════════════════════════════════════════════

async function getInventoryValue() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :et',
    ExpressionAttributeValues: { ':et': ENTITY_TYPES.PRODUCT },
  }));

  const totalInventoryValue = (result.Items || []).reduce(
    (sum, p) => sum + (p.price || 0) * (p.stock || 0),
    0
  );

  return success({ totalInventoryValue });
}


// ═══════════════════════════════════════════════════════
// 6. SELLER NOTIFICATIONS
//    Replaces: notificationController.getNotifications
//    Original: JOIN seller_notifications with sellers
//    DynamoDB: Direct query — notifications stored under
//              user partition (PK=USER#id), no JOIN needed
// ═══════════════════════════════════════════════════════

async function getNotifications(user) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.userPK(user.id),
      ':prefix': keys.notifPrefix(),
    },
    ScanIndexForward: false,  // Newest first
    Limit: 10,
  }));

  return success((result.Items || []).map((n) => ({
    id:         n.SK,
    message:    n.message,
    is_read:    n.isRead,
    created_at: n.createdAt,
  })));
}
