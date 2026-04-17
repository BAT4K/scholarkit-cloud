/**
 * ScholarKit — Demo Seed Script
 * 
 * Run AFTER demo_wipe.sql to populate the database with:
 *   1 Admin, 1 Seller, 1 Customer
 *   3 Schools (already seeded by SQL)
 *   ~18 products across 3 schools
 * 
 * Usage: node scripts/demo_seed.js
 */

const path = require('path');
const backendDir = path.join(__dirname, '..', 'backend');
const bcrypt = require(path.join(backendDir, 'node_modules', 'bcryptjs'));
const mysql = require(path.join(backendDir, 'node_modules', 'mysql2', 'promise'));
require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
  });

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  console.log('🔑 Password hash generated for all demo users.');

  // ──────────────────────────────────────────────
  // 1. INSERT USERS
  // ──────────────────────────────────────────────
  const users = [
    { name: 'Admin User',     email: 'admin@scholarkit.com',  role: 'admin' },
    { name: 'Ravi Kumar',     email: 'seller@scholarkit.com', role: 'seller' },
    { name: 'Priya Sharma',   email: 'parent@scholarkit.com', role: 'customer' },
  ];

  const userIds = {};
  for (const u of users) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [u.name, u.email, hash, u.role]
    );
    userIds[u.role] = result.insertId;
    console.log(`  ✅ ${u.role.padEnd(8)} → ${u.email} (id: ${result.insertId})`);
  }

  // ──────────────────────────────────────────────
  // 2. INSERT SELLER PROFILE
  // ──────────────────────────────────────────────
  const [sellerResult] = await pool.query(
    'INSERT INTO sellers (user_id, company_name, contact_phone) VALUES (?, ?, ?)',
    [userIds.seller, 'ScholarKit Uniforms Pvt. Ltd.', '9876543210']
  );
  const sellerId = sellerResult.insertId; // This is sellers.id, NOT users.id
  console.log(`  ✅ Seller profile created (sellers.id: ${sellerId}).`);

  // ──────────────────────────────────────────────
  // 3. UPDATE SCHOOLS — Link to seller
  // ──────────────────────────────────────────────
  await pool.query('UPDATE schools SET added_by_seller = ?', [sellerId]);
  console.log('  ✅ Schools linked to seller.');

  // ──────────────────────────────────────────────
  // 4. INSERT PRODUCTS (6 per school = 18 total)
  // ──────────────────────────────────────────────
  const products = [
    // ─── Shiv Nadar School (school_id=1) ───
    { school_id: 1, name: 'White Cotton Shirt',      price: 499,  stock: 50,  category: 'Shirt',    grade_group: 'primary',    discount_percent: 0,  size: 'M'  },
    { school_id: 1, name: 'Grey Trousers',           price: 599,  stock: 40,  category: 'Trouser',  grade_group: 'primary',    discount_percent: 10, size: 'M'  },
    { school_id: 1, name: 'School Blazer (Navy)',     price: 1299, stock: 25,  category: 'Blazer',   grade_group: 'secondary',  discount_percent: 0,  size: 'L'  },
    { school_id: 1, name: 'Sports T-Shirt (House)',   price: 399,  stock: 60,  category: 'Sportswear', grade_group: 'all',      discount_percent: 15, size: 'M'  },
    { school_id: 1, name: 'Black Leather Belt',       price: 249,  stock: 80,  category: 'Accessory', grade_group: 'all',       discount_percent: 0,  size: 'Free Size' },
    { school_id: 1, name: 'Tie (Striped)',            price: 199,  stock: 70,  category: 'Accessory', grade_group: 'secondary',  discount_percent: 5,  size: 'Free Size' },

    // ─── The Knowledge Habitat (school_id=2) ───
    { school_id: 2, name: 'Sky Blue Polo Shirt',     price: 549,  stock: 45,  category: 'Shirt',    grade_group: 'primary',    discount_percent: 0,  size: 'M'  },
    { school_id: 2, name: 'Navy Cargo Shorts',        price: 449,  stock: 35,  category: 'Shorts',   grade_group: 'foundation', discount_percent: 0,  size: 'S'  },
    { school_id: 2, name: 'Checked Pinafore Dress',   price: 699,  stock: 30,  category: 'Dress',    grade_group: 'foundation', discount_percent: 10, size: 'S'  },
    { school_id: 2, name: 'Track Pants (Navy)',        price: 499,  stock: 55,  category: 'Sportswear', grade_group: 'all',      discount_percent: 0,  size: 'L'  },
    { school_id: 2, name: 'Canvas Shoes (White)',      price: 899,  stock: 40,  category: 'Footwear', grade_group: 'all',        discount_percent: 20, size: 'Free Size' },
    { school_id: 2, name: 'Winter Sweater (V-Neck)',   price: 799,  stock: 20,  category: 'Winterwear', grade_group: 'all',      discount_percent: 0, size: 'L'  },

    // ─── Amity International (school_id=3) ───
    { school_id: 3, name: 'Cream Formal Shirt',      price: 549,  stock: 50,  category: 'Shirt',    grade_group: 'secondary',  discount_percent: 5,  size: 'M'  },
    { school_id: 3, name: 'Charcoal Trousers',        price: 649,  stock: 45,  category: 'Trouser',  grade_group: 'secondary',  discount_percent: 0,  size: 'L'  },
    { school_id: 3, name: 'House T-Shirt (Red)',       price: 349,  stock: 65,  category: 'Sportswear', grade_group: 'all',      discount_percent: 0,  size: 'M'  },
    { school_id: 3, name: 'PE Shorts',                 price: 299,  stock: 70,  category: 'Sportswear', grade_group: 'all',      discount_percent: 0,  size: 'M'  },
    { school_id: 3, name: 'School Socks (Pack of 3)',  price: 199,  stock: 100, category: 'Accessory', grade_group: 'all',       discount_percent: 10, size: 'Free Size' },
    { school_id: 3, name: 'Rain Jacket (Yellow)',      price: 999,  stock: 15,  category: 'Outerwear', grade_group: 'all',       discount_percent: 0,  size: 'L'  },
  ];

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (seller_id, school_id, name, price, stock, category, grade_group, discount_percent, image_url, size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
      [sellerId, p.school_id, p.name, p.price, p.stock, p.category, p.grade_group, p.discount_percent, p.size]
    );
  }
  console.log(`  ✅ ${products.length} products seeded across 3 schools.`);

  // ──────────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('🎓 ScholarKit — Demo Data Ready!');
  console.log('══════════════════════════════════════════════');
  console.log('');
  console.log('  LOGIN CREDENTIALS (all passwords: Demo@1234)');
  console.log('  ─────────────────────────────────────────────');
  console.log('  Admin    → admin@scholarkit.com');
  console.log('  Seller   → seller@scholarkit.com');
  console.log('  Customer → parent@scholarkit.com');
  console.log('');

  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
