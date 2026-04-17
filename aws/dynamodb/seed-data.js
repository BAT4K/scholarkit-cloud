#!/usr/bin/env node
// ══════════════════════════════════════════════════════════
// ScholarKit — Seed DynamoDB Table
// Run: node dynamodb/seed-data.js
//
// Seeds ALL production data from the MySQL dump into the
// DynamoDB single-table design. Uses BatchWriteItem for
// efficiency (25 items per batch).
//
// Prerequisites:
//   - Table "ScholarKit" must exist and be ACTIVE
//   - AWS credentials configured
// ══════════════════════════════════════════════════════════

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} = require('@aws-sdk/lib-dynamodb');

const {
  TABLE_NAME,
  AWS_REGION,
  ENTITY_TYPES,
  keys,
} = require('./table-config');

const client = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// ══════════════════════════════════════════════════════════
// DATA FROM production_dump.sql
// ══════════════════════════════════════════════════════════

// ── Users ───────────────────────────────────────────────
// All 3 users share the same bcrypt hash (password: same for demo)
const BCRYPT_HASH = '$2b$10$fV3NBBINgM98IU8cuLz8ruqWbDpD8J4vaxTnVdm.TLidgyYIaSJTC';

const users = [
  { id: 1, name: 'Admin User',   email: 'admin@scholarkit.com',  role: 'admin',    createdAt: '2026-04-17T06:35:10.000Z' },
  { id: 2, name: 'Ravi Kumar',   email: 'seller@scholarkit.com', role: 'seller',   createdAt: '2026-04-17T06:35:10.000Z' },
  { id: 3, name: 'Priya Sharma', email: 'parent@scholarkit.com', role: 'customer', createdAt: '2026-04-17T06:35:10.000Z' },
];

// ── Sellers ─────────────────────────────────────────────
const sellers = [
  { sellerId: 1, userId: 2, companyName: 'ScholarKit Uniforms Pvt. Ltd.', contactPhone: '9876543210' },
];

// ── Schools ─────────────────────────────────────────────
const schools = [
  { id: 1, name: 'Shiv Nadar School',     location: 'Noida',   addedBySeller: 1 },
  { id: 2, name: 'The Knowledge Habitat', location: 'Delhi',   addedBySeller: 1 },
  { id: 3, name: 'Amity International',   location: 'Gurugram', addedBySeller: 1 },
];

// ── Products (18 items) ─────────────────────────────────
const products = [
  { id: 1,  sellerId: 1, schoolId: 1, name: 'White Cotton Shirt',        price: 549,  stock: 49,  category: 'Shirt',      gradeGroup: 'primary',   discountPercent: 0,  size: 'M' },
  { id: 2,  sellerId: 1, schoolId: 1, name: 'Grey Trousers',             price: 599,  stock: 39,  category: 'Trouser',    gradeGroup: 'primary',   discountPercent: 10, size: 'M' },
  { id: 3,  sellerId: 1, schoolId: 1, name: 'School Blazer (Navy)',      price: 1299, stock: 24,  category: 'Blazer',     gradeGroup: 'secondary', discountPercent: 0,  size: 'L' },
  { id: 4,  sellerId: 1, schoolId: 1, name: 'Sports T-Shirt (House)',    price: 399,  stock: 60,  category: 'Sportswear', gradeGroup: 'all',       discountPercent: 15, size: 'M' },
  { id: 5,  sellerId: 1, schoolId: 1, name: 'Black Leather Belt',        price: 249,  stock: 80,  category: 'Accessory',  gradeGroup: 'all',       discountPercent: 0,  size: 'Free Size' },
  { id: 6,  sellerId: 1, schoolId: 1, name: 'Tie (Striped)',             price: 199,  stock: 70,  category: 'Accessory',  gradeGroup: 'secondary', discountPercent: 5,  size: 'Free Size' },
  { id: 7,  sellerId: 1, schoolId: 2, name: 'Sky Blue Polo Shirt',      price: 549,  stock: 45,  category: 'Shirt',      gradeGroup: 'primary',   discountPercent: 0,  size: 'M' },
  { id: 8,  sellerId: 1, schoolId: 2, name: 'Navy Cargo Shorts',        price: 449,  stock: 35,  category: 'Shorts',     gradeGroup: 'foundation', discountPercent: 0, size: 'S' },
  { id: 9,  sellerId: 1, schoolId: 2, name: 'Checked Pinafore Dress',   price: 699,  stock: 30,  category: 'Dress',      gradeGroup: 'foundation', discountPercent: 10, size: 'S' },
  { id: 10, sellerId: 1, schoolId: 2, name: 'Track Pants (Navy)',       price: 499,  stock: 55,  category: 'Sportswear', gradeGroup: 'all',       discountPercent: 0,  size: 'L' },
  { id: 11, sellerId: 1, schoolId: 2, name: 'Canvas Shoes (White)',     price: 899,  stock: 39,  category: 'Footwear',   gradeGroup: 'all',       discountPercent: 20, size: 'Free Size' },
  { id: 12, sellerId: 1, schoolId: 2, name: 'Winter Sweater (V-Neck)',  price: 799,  stock: 20,  category: 'Winterwear', gradeGroup: 'all',       discountPercent: 0,  size: 'L' },
  { id: 13, sellerId: 1, schoolId: 3, name: 'Cream Formal Shirt',       price: 549,  stock: 49,  category: 'Shirt',      gradeGroup: 'secondary', discountPercent: 5,  size: 'M' },
  { id: 14, sellerId: 1, schoolId: 3, name: 'Charcoal Trousers',        price: 649,  stock: 45,  category: 'Trouser',    gradeGroup: 'secondary', discountPercent: 0,  size: 'L' },
  { id: 15, sellerId: 1, schoolId: 3, name: 'House T-Shirt (Red)',      price: 349,  stock: 65,  category: 'Sportswear', gradeGroup: 'all',       discountPercent: 0,  size: 'M' },
  { id: 16, sellerId: 1, schoolId: 3, name: 'PE Shorts',                price: 299,  stock: 70,  category: 'Sportswear', gradeGroup: 'all',       discountPercent: 0,  size: 'M' },
  { id: 17, sellerId: 1, schoolId: 3, name: 'School Socks (Pack of 3)', price: 199,  stock: 100, category: 'Accessory',  gradeGroup: 'all',       discountPercent: 10, size: 'Free Size' },
  { id: 18, sellerId: 1, schoolId: 3, name: 'Rain Jacket (Yellow)',     price: 999,  stock: 12,  category: 'Outerwear',  gradeGroup: 'all',       discountPercent: 0,  size: 'L' },
];

// ── Orders ──────────────────────────────────────────────
const orders = [
  { id: 1, userId: 3, totalAmount: 1098, status: 'Delivered', createdAt: '2026-04-12T01:12:10.000Z', shippingFee: 0,  trackingNumber: null },
  { id: 2, userId: 3, totalAmount: 948,  status: 'Delivered', createdAt: '2026-04-14T01:12:10.000Z', shippingFee: 50, trackingNumber: null },
  { id: 3, userId: 3, totalAmount: 1847, status: 'Shipped',   createdAt: '2026-04-16T01:12:10.000Z', shippingFee: 0,  trackingNumber: null },
];

// ── Order Items ─────────────────────────────────────────
// Denormalized: includes productName, productCategory from products table
const orderItems = [
  { id: 1, orderId: 1, productId: 1,  quantity: 1, priceAtPurchase: 499,  productName: 'White Cotton Shirt',   productCategory: 'Shirt',   productImageUrl: null },
  { id: 2, orderId: 1, productId: 2,  quantity: 1, priceAtPurchase: 599,  productName: 'Grey Trousers',        productCategory: 'Trouser', productImageUrl: null },
  { id: 3, orderId: 2, productId: 11, quantity: 1, priceAtPurchase: 899,  productName: 'Canvas Shoes (White)', productCategory: 'Footwear', productImageUrl: null },
  { id: 4, orderId: 3, productId: 3,  quantity: 1, priceAtPurchase: 1299, productName: 'School Blazer (Navy)', productCategory: 'Blazer',  productImageUrl: null },
  { id: 5, orderId: 3, productId: 13, quantity: 1, priceAtPurchase: 549,  productName: 'Cream Formal Shirt',   productCategory: 'Shirt',   productImageUrl: null },
];

// ── Price History ───────────────────────────────────────
const priceHistory = [
  { productId: 1, oldPrice: 499, newPrice: 549, changedAt: '2026-04-17T01:12:10.000Z' },
];

// ── User lookup for denormalization ─────────────────────
const userMap = {};
users.forEach((u) => { userMap[u.id] = u; });

// ── Product lookup for denormalization ──────────────────
const productMap = {};
products.forEach((p) => { productMap[p.id] = p; });


// ══════════════════════════════════════════════════════════
// BUILD DynamoDB ITEMS
// ══════════════════════════════════════════════════════════

function buildAllItems() {
  const items = [];

  // ── Users ─────────────────────────────────────────────
  for (const u of users) {
    items.push({
      PK: keys.userPK(u.id),
      SK: keys.userSK(),
      GSI1PK: keys.emailGSI(u.email),
      GSI1SK: keys.userPK(u.id),
      entityType: ENTITY_TYPES.USER,
      userId: u.id,
      name: u.name,
      email: u.email,
      passwordHash: BCRYPT_HASH,
      role: u.role,
      createdAt: u.createdAt,
    });
  }

  // ── Sellers ───────────────────────────────────────────
  for (const s of sellers) {
    items.push({
      PK: keys.userPK(s.userId),
      SK: keys.sellerSK(),
      GSI1PK: keys.sellerGSI(s.sellerId),
      GSI1SK: keys.userPK(s.userId),
      entityType: ENTITY_TYPES.SELLER,
      sellerId: s.sellerId,
      userId: s.userId,
      companyName: s.companyName,
      contactPhone: s.contactPhone,
    });
  }

  // ── Schools ───────────────────────────────────────────
  for (const sc of schools) {
    items.push({
      PK: keys.schoolPK(sc.id),
      SK: keys.schoolSK(),
      GSI1PK: keys.allSchoolsGSI(),
      GSI1SK: keys.schoolPK(sc.id),
      entityType: ENTITY_TYPES.SCHOOL,
      schoolId: sc.id,
      name: sc.name,
      location: sc.location,
      addedBySeller: sc.addedBySeller,
    });
  }

  // ── Products ──────────────────────────────────────────
  for (const p of products) {
    items.push({
      PK: keys.productPK(p.id),
      SK: keys.productSK(),
      GSI1PK: keys.productInSchoolGSI(p.schoolId),
      GSI1SK: keys.productPK(p.id),
      entityType: ENTITY_TYPES.PRODUCT,
      productId: p.id,
      sellerId: p.sellerId,
      schoolId: p.schoolId,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
      gradeGroup: p.gradeGroup,
      discountPercent: p.discountPercent,
      imageUrl: p.imageUrl || null,
      size: p.size,
    });
  }

  // ── Orders (denormalized with user name/email) ────────
  for (const o of orders) {
    const user = userMap[o.userId];
    items.push({
      PK: keys.userPK(o.userId),
      SK: keys.orderSK(o.id),
      GSI1PK: keys.allOrdersGSI(),
      GSI1SK: keys.orderGSI1SK(o.createdAt, o.id),
      entityType: ENTITY_TYPES.ORDER,
      orderId: o.id,
      userId: o.userId,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
      shippingFee: o.shippingFee,
      trackingNumber: o.trackingNumber,
      // Denormalized from users table
      userName: user.name,
      userEmail: user.email,
    });
  }

  // ── Order Items (denormalized with product info) ──────
  for (const oi of orderItems) {
    items.push({
      PK: keys.orderItemPK(oi.orderId),
      SK: keys.orderItemSK(oi.productId),
      entityType: ENTITY_TYPES.ORDER_ITEM,
      orderId: oi.orderId,
      productId: oi.productId,
      quantity: oi.quantity,
      priceAtPurchase: oi.priceAtPurchase,
      // Denormalized from products table
      productName: oi.productName,
      productCategory: oi.productCategory,
      productImageUrl: oi.productImageUrl,
    });
  }

  // ── Price History ─────────────────────────────────────
  for (const ph of priceHistory) {
    items.push({
      PK: keys.productPK(ph.productId),
      SK: keys.priceHistorySK(ph.changedAt),
      entityType: ENTITY_TYPES.PRICE_HISTORY,
      productId: ph.productId,
      oldPrice: ph.oldPrice,
      newPrice: ph.newPrice,
      changedAt: ph.changedAt,
    });
  }

  // ── Sample Reviews (for Phase 3 Comprehend demo) ──────
  const sampleReviews = [
    {
      productId: 1,
      userId: 3,
      reviewText: 'Excellent quality cotton shirt! My child loves wearing it. The fabric is soft and breathable even in summer.',
      rating: 5,
      sentiment: null,       // Will be filled by Comprehend in Phase 3
      sentimentScore: null,
      createdAt: '2026-04-13T10:30:00.000Z',
    },
    {
      productId: 2,
      userId: 3,
      reviewText: 'The trousers are decent but the stitching came loose after two washes. Expected better quality for the price.',
      rating: 3,
      sentiment: null,
      sentimentScore: null,
      createdAt: '2026-04-14T15:45:00.000Z',
    },
    {
      productId: 11,
      userId: 3,
      reviewText: 'These canvas shoes are terrible. They fell apart within a week! Complete waste of money, very disappointed.',
      rating: 1,
      sentiment: null,
      sentimentScore: null,
      createdAt: '2026-04-15T08:20:00.000Z',
    },
  ];

  for (const r of sampleReviews) {
    items.push({
      PK: keys.productPK(r.productId),
      SK: keys.reviewSK(r.userId),
      GSI1PK: keys.userReviewGSI(r.userId),
      GSI1SK: keys.reviewGSI1SK(r.productId),
      entityType: ENTITY_TYPES.REVIEW,
      userId: r.userId,
      productId: r.productId,
      reviewText: r.reviewText,
      rating: r.rating,
      sentiment: r.sentiment,
      sentimentScore: r.sentimentScore,
      createdAt: r.createdAt,
    });
  }

  return items;
}


// ══════════════════════════════════════════════════════════
// BATCH WRITE (25 items per batch — DynamoDB limit)
// ══════════════════════════════════════════════════════════

async function batchWrite(items) {
  const BATCH_SIZE = 25;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const requestItems = {
      [TABLE_NAME]: batch.map((item) => ({
        PutRequest: { Item: item },
      })),
    };

    let retries = 0;
    let unprocessed = requestItems;

    while (Object.keys(unprocessed).length > 0 && retries < 5) {
      const result = await docClient.send(
        new BatchWriteCommand({ RequestItems: unprocessed })
      );

      unprocessed = result.UnprocessedItems || {};

      if (Object.keys(unprocessed).length > 0) {
        retries++;
        // Exponential backoff
        const delay = Math.pow(2, retries) * 100;
        console.log(`   ⚠  ${Object.keys(unprocessed).length} unprocessed items, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    console.log(`   ✓ Batch ${batchNum}/${totalBatches} — wrote ${batch.length} items`);
  }
}


// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ScholarKit — DynamoDB Data Seeder          ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  const items = buildAllItems();

  // Summary
  const counts = {};
  items.forEach((item) => {
    counts[item.entityType] = (counts[item.entityType] || 0) + 1;
  });

  console.log('📦 Items to seed:');
  for (const [type, count] of Object.entries(counts)) {
    console.log(`   ${type.padEnd(20)} ${count}`);
  }
  console.log(`   ${'─'.repeat(30)}`);
  console.log(`   ${'TOTAL'.padEnd(20)} ${items.length}`);
  console.log();

  console.log(`⏳ Writing to table "${TABLE_NAME}"...`);
  console.log();

  try {
    await batchWrite(items);
    console.log();
    console.log('═══════════════════════════════════════════════');
    console.log('🎉 Seed complete! All production data loaded.');
    console.log('═══════════════════════════════════════════════');
    console.log();
    console.log('Entity summary:');
    console.log(`  👤 Users:          ${users.length}`);
    console.log(`  🏪 Sellers:        ${sellers.length}`);
    console.log(`  🏫 Schools:        ${schools.length}`);
    console.log(`  📦 Products:       ${products.length}`);
    console.log(`  🛒 Orders:         ${orders.length}`);
    console.log(`  📋 Order Items:    ${orderItems.length}`);
    console.log(`  📈 Price History:  ${priceHistory.length}`);
    console.log(`  ⭐ Reviews:        3 (sample for Phase 3)`);
    console.log();
    console.log('Next step: Phase 2 — Rewrite Express controllers as Lambda functions.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error();
    console.error('Troubleshooting:');
    console.error('  1. Ensure the table exists: node dynamodb/create-table.js');
    console.error('  2. Ensure the table is ACTIVE (not CREATING)');
    console.error('  3. Check AWS credentials: aws sts get-caller-identity');
    process.exit(1);
  }
}

main();
