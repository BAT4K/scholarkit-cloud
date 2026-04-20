// ══════════════════════════════════════════════════════════
// ScholarKit — DynamoDB Single-Table Configuration
// Shared constants used by create-table.js, seed-data.js,
// and all Lambda functions in later phases.
// ══════════════════════════════════════════════════════════

const TABLE_NAME = 'ScholarKit';

// Primary Key attribute names
const PK = 'PK';
const SK = 'SK';

// Global Secondary Index 1 (Overloaded)
const GSI1_NAME = 'GSI1';
const GSI1PK = 'GSI1PK';
const GSI1SK = 'GSI1SK';

// AWS Region — use the one closest to you, or us-east-1 for max free-tier coverage
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Entity type constants (used in entityType attribute for filtering)
const ENTITY_TYPES = {
  USER: 'USER',
  SELLER: 'SELLER',
  SCHOOL: 'SCHOOL',
  PRODUCT: 'PRODUCT',
  CART_ITEM: 'CART_ITEM',
  ORDER: 'ORDER',
  ORDER_ITEM: 'ORDER_ITEM',
  PRICE_HISTORY: 'PRICE_HISTORY',
  NOTIFICATION: 'NOTIFICATION',
  REVIEW: 'REVIEW',
};

// Key prefix builders — centralized to avoid typos across Lambda functions
const keys = {
  // User
  userPK: (id) => `USER#${id}`,
  userSK: () => 'PROFILE',
  emailGSI: (email) => `EMAIL#${email}`,

  // Seller
  sellerSK: () => 'SELLER',
  sellerGSI: (sellerId) => `SELLER#${sellerId}`,

  // School
  schoolPK: (id) => `SCHOOL#${id}`,
  schoolSK: () => 'METADATA',
  allSchoolsGSI: () => 'ENTITY#SCHOOL',

  // Product
  productPK: (id) => `PRODUCT#${id}`,
  productSK: () => 'METADATA',
  productInSchoolGSI: (schoolId) => `SCHOOL#${schoolId}`,

  // Cart
  cartSK: (productId, size) => `CART#${productId}#${size}`,
  cartPrefix: () => 'CART#',

  // Order
  orderSK: (orderId) => `ORDER#${orderId}`,
  orderPrefix: () => 'ORDER#',
  allOrdersGSI: () => 'ENTITY#ORDER',
  orderGSI1SK: (createdAt, orderId) => `${createdAt}#${orderId}`,

  // Order Item
  orderItemPK: (orderId) => `ORDER#${orderId}`,
  orderItemSK: (productId) => `ITEM#${productId}`,
  orderItemPrefix: () => 'ITEM#',

  // Price History
  priceHistorySK: (timestamp) => `PRICEHISTORY#${timestamp}`,
  priceHistoryPrefix: () => 'PRICEHISTORY#',

  // Notification
  notifSK: (timestamp) => `NOTIF#${timestamp}`,
  notifPrefix: () => 'NOTIF#',

  // Review (Phase 3)
  reviewSK: (userId) => `REVIEW#${userId}`,
  reviewPrefix: () => 'REVIEW#',
  userReviewGSI: (userId) => `USER#${userId}`,
  reviewGSI1SK: (productId) => `REVIEW#${productId}`,
};

module.exports = {
  TABLE_NAME,
  PK,
  SK,
  GSI1_NAME,
  GSI1PK,
  GSI1SK,
  AWS_REGION,
  ENTITY_TYPES,
  keys,
};
