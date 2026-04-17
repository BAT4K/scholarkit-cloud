// ══════════════════════════════════════════════════════════
// ScholarKit — Cart Lambda Handler
// ─────────────────────────────────────────────────────────
// Replaces: backend/controllers/cartController.js
//
// Routes:
//   GET    /cart           → Get user's cart
//   POST   /cart           → Add item to cart
//   PUT    /cart/:id       → Update quantity
//   DELETE /cart/:id       → Remove item
//
// Cart items are denormalised with product info for display.
// The :id param is a compound key "productId__size" (e.g. "7__M").
// ══════════════════════════════════════════════════════════

const { docClient } = require('./shared/dynamo');
const { requireAuth } = require('./shared/auth');
const { success, error, options } = require('./shared/response');
const { TABLE_NAME, keys, ENTITY_TYPES } = require('./shared/tableConfig');
const {
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

const PRODUCT_PLACEHOLDER = 'https://placehold.co/600x400/e2e8f0/1e3a8a?text=ScholarKit';

// ── Handler & Router ────────────────────────────────────

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === 'OPTIONS') return options();

  const path = (event.path || event.rawPath || '').replace(/\/+$/, '');

  try {
    const user = requireAuth(event);

    const segments = path.split('/').filter(Boolean);
    const cartIdx = segments.indexOf('cart');
    if (cartIdx === -1) return error('Route not found', 404);

    const sub = segments.slice(cartIdx + 1);

    // GET / POST  /cart
    if (sub.length === 0) {
      if (method === 'GET')  return getCart(user);
      if (method === 'POST') return addToCart(event, user);
    }

    // PUT / DELETE  /cart/:id
    if (sub.length === 1) {
      const itemId = decodeURIComponent(sub[0]);
      if (method === 'PUT' || method === 'PATCH') return updateCartItem(event, user, itemId);
      if (method === 'DELETE')                    return removeFromCart(user, itemId);
    }

    return error('Route not found', 404);
  } catch (err) {
    console.error('Cart Lambda Error:', err);
    if (err.statusCode) return error(err.message, err.statusCode);
    return error('Internal server error', 500);
  }
};


// ═══════════════════════════════════════════════════════
// 1. GET CART
//    Replaces: cartController.getCart
//    DynamoDB:  Query — PK=USER#id, SK begins_with CART#
// ═══════════════════════════════════════════════════════

async function getCart(user) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     keys.userPK(user.id),
      ':prefix': keys.cartPrefix(),
    },
  }));

  const items = (result.Items || []).map((c) => ({
    // Compound ID for delete/update — matches "productId__size"
    id:               `${c.productId}__${c.size}`,
    quantity:         c.quantity,
    size:             c.size,
    product_id:       c.productId,
    name:             c.productName,
    price:            c.productPrice,
    discount_percent: c.productDiscountPercent || 0,
    image_url:        c.productImageUrl || PRODUCT_PLACEHOLDER,
  }));

  return success(items);
}


// ═══════════════════════════════════════════════════════
// 2. ADD TO CART (Upsert)
//    Replaces: cartController.addToCart
//    DynamoDB:  UpdateItem with if_not_exists (single-op upsert)
//
//    The original Express controller did:
//      1. SELECT to check if item exists
//      2. UPDATE if yes, INSERT if no
//    DynamoDB does this in ONE atomic UpdateItem.
// ═══════════════════════════════════════════════════════

async function addToCart(event, user) {
  const body = JSON.parse(event.body || '{}');
  const { product_id, quantity, size } = body;

  if (!product_id) return error('product_id is required.', 400);

  const itemSize = size || 'Standard';
  const itemQty  = quantity || 1;

  // Fetch current product info for denormalisation
  const product = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: keys.productPK(product_id), SK: keys.productSK() },
  }));

  if (!product.Item) return error('Product not found.', 404);

  const p = product.Item;

  // Atomic upsert: increment qty if exists, create if not
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: keys.userPK(user.id),
      SK: keys.cartSK(product_id, itemSize),
    },
    UpdateExpression: `
      SET quantity          = if_not_exists(quantity, :zero) + :qty,
          entityType        = :et,
          productId         = :pid,
          #sz               = :itemSize,
          addedAt           = if_not_exists(addedAt, :now),
          productName       = :pname,
          productPrice      = :pprice,
          productDiscountPercent = :pdisc,
          productImageUrl   = :pimg,
          productCategory   = :pcat
    `,
    ExpressionAttributeNames: {
      '#sz': 'size',   // 'size' is a DynamoDB reserved word
    },
    ExpressionAttributeValues: {
      ':zero':     0,
      ':qty':      itemQty,
      ':et':       ENTITY_TYPES.CART_ITEM,
      ':pid':      Number(product_id),
      ':itemSize': itemSize,
      ':now':      new Date().toISOString(),
      ':pname':    p.name,
      ':pprice':   p.price,
      ':pdisc':    p.discountPercent || 0,
      ':pimg':     p.imageUrl || null,
      ':pcat':     p.category || null,
    },
  }));

  return success({ message: 'Item added to cart successfully' });
}


// ═══════════════════════════════════════════════════════
// 3. REMOVE FROM CART
//    Replaces: cartController.removeFromCart
//    DynamoDB:  DeleteItem
// ═══════════════════════════════════════════════════════

async function removeFromCart(user, itemId) {
  const { productId, size } = parseCartItemId(itemId);

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: keys.userPK(user.id),
      SK: keys.cartSK(productId, size),
    },
  }));

  return success({ message: 'Item removed from cart' });
}


// ═══════════════════════════════════════════════════════
// 4. UPDATE CART QUANTITY
//    Replaces: cartController.updateCartItem
//    DynamoDB:  UpdateItem
// ═══════════════════════════════════════════════════════

async function updateCartItem(event, user, itemId) {
  const { productId, size } = parseCartItemId(itemId);
  const body = JSON.parse(event.body || '{}');
  const { quantity } = body;

  if (quantity == null || quantity < 1) {
    return error('Quantity must be at least 1.', 400);
  }

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: keys.userPK(user.id),
      SK: keys.cartSK(productId, size),
    },
    UpdateExpression: 'SET quantity = :qty',
    ExpressionAttributeValues: { ':qty': quantity },
  }));

  return success({ message: 'Cart quantity updated successfully' });
}


// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Parse compound cart item ID "productId__size" back into parts.
 * Examples:  "7__M"  →  { productId: "7", size: "M" }
 *            "5__Free Size" → { productId: "5", size: "Free Size" }
 */
function parseCartItemId(id) {
  const sepIdx = id.indexOf('__');
  if (sepIdx === -1) {
    return { productId: id, size: 'Standard' };
  }
  return {
    productId: id.substring(0, sepIdx),
    size:      id.substring(sepIdx + 2),
  };
}
