// ══════════════════════════════════════════════════════════
// ScholarKit — Products & Catalog Lambda Handler
// ─────────────────────────────────────────────────────────
// Replaces: backend/controllers/productController.js
//           backend/controllers/shopController.js
//
// Routes:
//   GET    /schools                       → List all schools
//   GET    /schools/:id/groups             → List grade groups for a school
//   GET    /products                      → Seller product inventory
//   GET    /products/images               → Image gallery
//   GET    /products/:id                  → Single product
//   POST   /products                      → Create product
//   PUT    /products/:id                  → Update product
//   DELETE /products/:id                  → Delete product
//   PATCH  /products/:id/stock            → Update stock only
//   GET    /products/:id/price-history    → Price change log
//   GET    /shop/catalog                  → Storefront catalog
//   GET    /recommendations               → Personalised picks
//
// MySQL-Trigger Equivalents (now application logic):
//   • Price update  → logs PRICE_HISTORY item
//   • Stock < 10    → creates NOTIFICATION item for seller
// ══════════════════════════════════════════════════════════

const { docClient } = require('../shared/dynamo');
const { requireAuth } = require('../shared/auth');
const { success, error, options } = require('../shared/response');
const { TABLE_NAME, GSI1_NAME, keys, ENTITY_TYPES } = require('../shared/tableConfig');
const {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const PRODUCT_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/1e3a8a?text=ScholarKit';
const isPrivileged = (u) => u?.role === 'admin' || u?.role === 'seller';

// ═══════════════════════════════════════════════════════
// HANDLER + ROUTER
// ═══════════════════════════════════════════════════════

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  const path = (event.path || event.rawPath || '').replace(/\/+$/, '');

  try {
    return await route(method, path, event);
  } catch (err) {
    console.error('Products Lambda Error:', err);
    if (err.statusCode) return error(err.message, err.statusCode);
    return error('Internal server error', 500);
  }
};

async function route(method, path, event) {
  // Normalise: support /api/products/... or bare /products/...
  const segments = path.split('/').filter(Boolean);
  const anchorIdx = segments.findIndex((s) =>
    ['products', 'schools', 'shop', 'catalog', 'recommendations'].includes(s)
  );
  if (anchorIdx === -1) return error('Route not found', 404);

  const resource = segments[anchorIdx];
  const sub = segments.slice(anchorIdx + 1);

  switch (resource) {
    case 'schools':
      if (method === 'GET' && sub.length === 0) return getSchools();
      if (method === 'GET' && sub.length === 2 && sub[1] === 'groups') return getSchoolGroups(sub[0]);
      break;
    case 'catalog':
      if (method === 'GET') return getCatalog(event);
      break;
    case 'recommendations':
      if (method === 'GET') return getRecommendations(requireAuth(event));
      break;
    case 'shop':
      if (sub[0] === 'catalog' && method === 'GET') return getCatalog(event);
      break;
    case 'products':
      return routeProducts(method, sub, event);
  }

  return error('Route not found', 404);
}

async function routeProducts(method, sub, event) {
  // GET / POST  /products
  if (sub.length === 0) {
    if (method === 'GET')  return getSellerProducts(event, requireAuth(event));
    if (method === 'POST') return createProduct(event, requireAuth(event));
    return error('Method not allowed', 405);
  }

  // GET /products/images
  if (sub[0] === 'images' && method === 'GET') {
    return getImageGallery(requireAuth(event));
  }

  // Everything below has a product ID as sub[0]
  const id = sub[0];

  if (sub.length === 1) {
    if (method === 'GET')    return getProduct(id);
    if (method === 'PUT')    return updateProduct(event, requireAuth(event), id);
    if (method === 'DELETE') return deleteProduct(requireAuth(event), id);
  }

  if (sub.length === 2) {
    if (sub[1] === 'stock'         && method === 'PATCH') return updateStock(event, requireAuth(event), id);
    if (sub[1] === 'price-history' && method === 'GET')   return getPriceHistory(id);
  }

  return error('Route not found', 404);
}


// ═══════════════════════════════════════════════════════
// 1. LIST ALL SCHOOLS
//    Replaces: productController.getSchools
//    DynamoDB:  GSI1 Query — GSI1PK = ENTITY#SCHOOL
// ═══════════════════════════════════════════════════════

async function getSchools() {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': keys.allSchoolsGSI() },
  }));

  const schools = (result.Items || [])
    .map((s) => ({ id: s.schoolId, name: s.name, location: s.location }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return success(schools);
}


// ═══════════════════════════════════════════════════════
// 1B. LIST GRADE GROUPS FOR A SCHOOL
//     Derives groups from products' gradeGroup field.
//     Returns: [{ id: 1, name: 'Foundation' }, ...]
// ═══════════════════════════════════════════════════════

async function getSchoolGroups(schoolId) {
  // Query all products for this school
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': keys.productInSchoolGSI(schoolId) },
  }));

  // Extract unique grade groups from products
  const groupSet = new Set();
  for (const item of (result.Items || [])) {
    if (item.entityType === ENTITY_TYPES.PRODUCT && item.gradeGroup && item.gradeGroup !== 'all') {
      groupSet.add(item.gradeGroup);
    }
  }

  // Map to the format the frontend expects
  const GROUP_ORDER = { foundation: 1, primary: 2, secondary: 3 };
  const groups = [...groupSet]
    .sort((a, b) => (GROUP_ORDER[a] || 99) - (GROUP_ORDER[b] || 99))
    .map((name) => ({
      id: GROUP_ORDER[name] || 99,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }));

  return success(groups);
}


// ═══════════════════════════════════════════════════════
// 2. SINGLE PRODUCT
//    Replaces: direct GET /products/:id
//    DynamoDB:  GetItem — PK=PRODUCT#id, SK=METADATA
// ═══════════════════════════════════════════════════════

async function getProduct(id) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
  }));

  if (!result.Item) return error('Product not found', 404);

  const schoolNames = await lookupSchoolNames([result.Item.schoolId]);
  return success(formatProduct(result.Item, schoolNames));
}


// ═══════════════════════════════════════════════════════
// 3. SELLER / ADMIN PRODUCT LIST
//    Replaces: productController.getSellerProducts
//    DynamoDB:  GSI1 Query (by school) or Scan (all)
// ═══════════════════════════════════════════════════════

async function getSellerProducts(event, user) {
  if (!isPrivileged(user)) return error('Access denied.', 403);

  const qs = event.queryStringParameters || {};
  const schoolId = qs.school_id;
  let items;

  if (schoolId) {
    // Products for a specific school — efficient GSI1 query
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': keys.productInSchoolGSI(schoolId) },
    }));
    items = (result.Items || []).filter((i) => i.entityType === ENTITY_TYPES.PRODUCT);
  } else {
    // All products — Scan is fine for 18 items
    const result = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'entityType = :et',
      ExpressionAttributeValues: { ':et': ENTITY_TYPES.PRODUCT },
    }));
    items = result.Items || [];
  }

  // Denormalise school names (replaces the MySQL LEFT JOIN)
  const schoolIds = [...new Set(items.map((i) => i.schoolId).filter(Boolean))];
  const schoolNames = await lookupSchoolNames(schoolIds);

  const products = items
    .map((i) => formatProduct(i, schoolNames))
    .sort((a, b) => {
      const sc = (a.school_name || '').localeCompare(b.school_name || '');
      return sc !== 0 ? sc : a.name.localeCompare(b.name);
    });

  return success(products);
}


// ═══════════════════════════════════════════════════════
// 4. CREATE PRODUCT
//    Replaces: productController.createProduct
//    DynamoDB:  PutItem — PRODUCT#<newId> + GSI1 SCHOOL#
// ═══════════════════════════════════════════════════════

async function createProduct(event, user) {
  if (!isPrivileged(user)) return error('Access denied.', 403);

  const body = JSON.parse(event.body || '{}');
  const { name, price } = body;
  if (!name || price == null) return error('Name and price are required.', 400);

  const productId = Date.now();
  const sellerId  = user.role === 'admin' ? (body.seller_id || user.id) : user.id;
  const schoolId  = body.school_id || null;

  const item = {
    PK:       keys.productPK(productId),
    SK:       keys.productSK(),
    entityType: ENTITY_TYPES.PRODUCT,
    productId,
    sellerId,
    schoolId,
    name,
    price:           Number(price),
    stock:           Number(body.stock || 0),
    category:        body.category || null,
    gradeGroup:      body.grade_group || null,
    discountPercent: Number(body.discount_percent || 0),
    imageUrl:        body.image_url || null,
    size:            body.size || null,
  };

  // Products with a school get a GSI1 entry for school queries
  if (schoolId) {
    item.GSI1PK = keys.productInSchoolGSI(schoolId);
    item.GSI1SK = keys.productPK(productId);
  }

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  return success(formatProduct(item, {}), 201);
}


// ═══════════════════════════════════════════════════════
// 5. UPDATE PRODUCT (Full Update)
//    Replaces: productController.updateProduct
//    DynamoDB:  GetItem (RBAC check) → UpdateItem
//    Trigger equivalents:
//      • Price change  → PutItem PRICEHISTORY#<ts>
//      • Stock < 10    → PutItem NOTIF#<ts>
// ═══════════════════════════════════════════════════════

async function updateProduct(event, user, id) {
  if (!isPrivileged(user)) return error('Access denied.', 403);

  // Fetch existing product (needed for RBAC + trigger logic)
  const existing = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
  }));
  if (!existing.Item) return error('Product not found.', 404);

  const old = existing.Item;

  // RBAC: sellers can only edit their own products
  if (user.role !== 'admin' && old.sellerId !== user.id) {
    return error('You can only edit your own products.', 403);
  }

  const body = JSON.parse(event.body || '{}');
  const updates = {};

  if (body.name             !== undefined) updates.name            = body.name;
  if (body.price            !== undefined) updates.price           = Number(body.price);
  if (body.stock            !== undefined) updates.stock           = Number(body.stock);
  if (body.category         !== undefined) updates.category        = body.category;
  if (body.discount_percent !== undefined) updates.discountPercent = Number(body.discount_percent);
  if (body.size             !== undefined) updates.size            = body.size;
  if (body.image_url        !== undefined) updates.imageUrl        = body.image_url;

  // Only admins can reassign school
  if (user.role === 'admin' && body.school_id !== undefined) {
    updates.schoolId = body.school_id;
    updates.GSI1PK   = keys.productInSchoolGSI(body.school_id);
  }

  if (Object.keys(updates).length === 0) return error('No fields to update.', 400);

  // Build dynamic UpdateExpression
  const names = {}, values = {}, setClauses = [];
  let idx = 0;
  for (const [key, val] of Object.entries(updates)) {
    names[`#f${idx}`]  = key;
    values[`:v${idx}`] = val;
    setClauses.push(`#f${idx} = :v${idx}`);
    idx++;
  }

  const updated = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
    UpdateExpression: `SET ${setClauses.join(', ')}`,
    ExpressionAttributeNames:  names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));

  // ── Trigger Equivalent: Price History Log ──────────
  if (updates.price !== undefined && updates.price !== old.price) {
    const now = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.productPK(id),
        SK: keys.priceHistorySK(now),
        entityType: ENTITY_TYPES.PRICE_HISTORY,
        productId: Number(id),
        oldPrice: old.price,
        newPrice: updates.price,
        changedAt: now,
      },
    }));
  }

  // ── Trigger Equivalent: Stock Depletion Alert ─────
  const newStock = updates.stock ?? old.stock;
  if (newStock < 10 && old.stock >= 10) {
    await createStockAlert(old, newStock);
  }

  const schoolNames = await lookupSchoolNames([updated.Attributes?.schoolId || old.schoolId]);
  return success(formatProduct(updated.Attributes, schoolNames));
}


// ═══════════════════════════════════════════════════════
// 6. DELETE PRODUCT
//    Replaces: productController.deleteProduct
//    DynamoDB:  GetItem (RBAC) → DeleteItem
// ═══════════════════════════════════════════════════════

async function deleteProduct(user, id) {
  if (!isPrivileged(user)) return error('Access denied.', 403);

  const existing = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
  }));
  if (!existing.Item) return error('Product not found.', 404);

  if (user.role !== 'admin' && existing.Item.sellerId !== user.id) {
    return error('You can only delete your own products.', 403);
  }

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
  }));

  return success({ message: 'Product deleted successfully.' });
}


// ═══════════════════════════════════════════════════════
// 7. UPDATE STOCK ONLY
//    Replaces: productController.updateProductStock
//    DynamoDB:  GetItem → UpdateItem (stock attribute)
// ═══════════════════════════════════════════════════════

async function updateStock(event, user, id) {
  if (!isPrivileged(user)) return error('Access denied.', 403);

  const body = JSON.parse(event.body || '{}');
  const stock = parseInt(body.stock, 10);
  if (isNaN(stock) || stock < 0) {
    return error('Stock must be a non-negative number.', 400);
  }

  const existing = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
  }));
  if (!existing.Item) return error('Product not found.', 404);

  const old = existing.Item;

  const updated = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
    UpdateExpression: 'SET stock = :s',
    ExpressionAttributeValues: { ':s': stock },
    ReturnValues: 'ALL_NEW',
  }));

  // Stock depletion trigger
  if (stock < 10 && old.stock >= 10) {
    await createStockAlert(old, stock);
  }

  return success({
    id:    updated.Attributes.productId,
    name:  updated.Attributes.name,
    stock: updated.Attributes.stock,
  });
}


// ═══════════════════════════════════════════════════════
// 8. PRICE HISTORY
//    Replaces: productController.getProductPriceHistory
//    DynamoDB:  Query — PK=PRODUCT#id, SK begins_with PRICEHISTORY#
// ═══════════════════════════════════════════════════════

async function getPriceHistory(id) {
  const product = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(id), SK: keys.productSK() },
  }));
  if (!product.Item) return error('Product not found.', 404);

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.productPK(id),
      ':prefix': keys.priceHistoryPrefix(),
    },
    ScanIndexForward: false,   // Newest first
    Limit: 20,
  }));

  const history = (result.Items || []).map((h) => ({
    old_price:  h.oldPrice,
    new_price:  h.newPrice,
    changed_at: h.changedAt,
  }));

  // If no history, return current price as the only entry
  if (history.length === 0) {
    return success([{
      old_price:  product.Item.price,
      new_price:  product.Item.price,
      changed_at: new Date().toISOString(),
    }]);
  }

  return success(history);
}


// ═══════════════════════════════════════════════════════
// 9. STOREFRONT CATALOG
//    Replaces: shopController.getGroupCatalog
//    DynamoDB:  GSI1 Query — SCHOOL#<schoolId> + filter
// ═══════════════════════════════════════════════════════

async function getCatalog(event) {
  const qs = event.queryStringParameters || {};
  const { school_id, group_id, gender } = qs;

  if (!school_id) return error('Missing school_id query parameter.', 400);

  // Query all products for this school via GSI1
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': keys.productInSchoolGSI(school_id) },
  }));

  let products = (result.Items || []).filter((i) => i.entityType === ENTITY_TYPES.PRODUCT);

  // Filter by grade group (matches original fallback groups: 1=foundation, 2=primary, 3=secondary)
  if (group_id) {
    const groupMap = { '1': 'foundation', '2': 'primary', '3': 'secondary' };
    const groupName = groupMap[group_id] || group_id;
    products = products.filter((p) => p.gradeGroup === groupName || p.gradeGroup === 'all');
  }

  // Gender heuristic (matches original Express shopController logic)
  if (gender) {
    const g = gender.toLowerCase();
    if (g === 'male')   products = products.filter((p) => !p.name.toLowerCase().includes('skirt'));
    if (g === 'female') products = products.filter((p) => !p.name.toLowerCase().includes('shorts'));
  }

  const formatted = products.map((p) => ({
    id:               p.productId,
    name:             p.name,
    price:            p.price,
    category:         p.category,
    stock:            p.stock,
    school_id:        p.schoolId,
    discount_percent: p.discountPercent,
    image_url:        p.imageUrl || PRODUCT_PLACEHOLDER,
    is_mandatory:     1,
    specific_gender:  'Unisex',
  }));

  return success(formatted);
}


// ═══════════════════════════════════════════════════════
// 10. PERSONALISED RECOMMENDATIONS
//     Replaces: productController.getRecommendations
//               (was MySQL view vw_user_recommendations)
//     DynamoDB:  Multi-query → User's orders → Items → Schools → Filter
// ═══════════════════════════════════════════════════════

async function getRecommendations(user) {
  // 1. Get user's orders
  const ordersResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.userPK(user.id),
      ':prefix': keys.orderPrefix(),
    },
  }));

  if (!ordersResult.Items?.length) return success([]);

  // 2. Get order items → collect purchased product IDs
  const purchasedIds = new Set();
  for (const order of ordersResult.Items) {
    const itemsResult = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk':     keys.orderItemPK(order.orderId),
        ':prefix': keys.orderItemPrefix(),
      },
    }));
    for (const item of (itemsResult.Items || [])) {
      purchasedIds.add(String(item.productId));
    }
  }

  // 3. Look up purchased products to find their schools
  const purchasedSchools = new Set();
  for (const pid of purchasedIds) {
    const prod = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: keys.productPK(pid), SK: keys.productSK() },
    }));
    if (prod.Item) purchasedSchools.add(prod.Item.schoolId);
  }

  // 4. Get all products from those schools, excluding already purchased
  const recommendations = [];
  for (const schoolId of purchasedSchools) {
    const schoolProducts = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': keys.productInSchoolGSI(schoolId) },
    }));

    for (const p of (schoolProducts.Items || [])) {
      if (p.entityType !== ENTITY_TYPES.PRODUCT) continue;
      if (purchasedIds.has(String(p.productId))) continue;
      if (p.stock <= 0) continue;
      recommendations.push(p);
    }
  }

  // 5. Get school names and format
  const schoolIds = [...new Set(recommendations.map((r) => r.schoolId))];
  const schoolNames = await lookupSchoolNames(schoolIds);

  return success(
    recommendations.slice(0, 8).map((r) => ({
      id:               r.productId,
      name:             r.name,
      price:            r.price,
      category:         r.category,
      stock:            r.stock,
      discount_percent: r.discountPercent,
      school_name:      schoolNames[r.schoolId] || null,
    }))
  );
}


// ═══════════════════════════════════════════════════════
// 11. IMAGE GALLERY
//     Replaces: productController.getImageGallery
//     DynamoDB:  Scan with filter (small dataset)
// ═══════════════════════════════════════════════════════

async function getImageGallery(user) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'entityType = :et',
    ExpressionAttributeValues: { ':et': ENTITY_TYPES.PRODUCT },
  }));

  let items = (result.Items || []).filter((p) => p.imageUrl);

  // Sellers see only their own images; admins see all
  if (user.role !== 'admin') {
    items = items.filter((p) => p.sellerId === user.id);
  }

  return success([...new Set(items.map((p) => p.imageUrl))]);
}


// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Batch-lookup school names for a set of school IDs.
 * Replaces the MySQL LEFT JOIN with schools table.
 */
async function lookupSchoolNames(schoolIds) {
  const map = {};
  const unique = [...new Set(schoolIds)].filter((id) => id != null);

  for (const id of unique) {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: keys.schoolPK(id), SK: keys.schoolSK() },
    }));
    if (result.Item) map[id] = result.Item.name;
  }
  return map;
}

/**
 * Trigger equivalent: creates a seller notification when stock drops below 10.
 * Replaces MySQL trigger `after_stock_depletion`.
 */
async function createStockAlert(product, newStock) {
  // Find the seller's user ID via GSI1 (SELLER#<sellerId>)
  const sellerResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': keys.sellerGSI(product.sellerId) },
    Limit: 1,
  }));

  if (!sellerResult.Items?.length) return;

  const now = new Date().toISOString();
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: keys.userPK(sellerResult.Items[0].userId),
      SK: keys.notifSK(now),
      entityType: ENTITY_TYPES.NOTIFICATION,
      message: `URGENT: Stock for ${product.name} has dropped to ${newStock}`,
      isRead: false,
      createdAt: now,
    },
  }));
}

/**
 * Format a DynamoDB product item into the API response shape
 * that the React frontend expects (snake_case keys matching
 * the original Express/MySQL response format).
 */
function formatProduct(item, schoolNames = {}) {
  return {
    id:               item.productId,
    name:             item.name,
    price:            item.price,
    stock:            item.stock,
    category:         item.category,
    grade_group:      item.gradeGroup,
    discount_percent: item.discountPercent,
    image_url:        item.imageUrl || PRODUCT_PLACEHOLDER,
    size:             item.size,
    school_id:        item.schoolId,
    seller_id:        item.sellerId,
    school_name:      schoolNames[item.schoolId] || null,
  };
}
