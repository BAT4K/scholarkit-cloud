-- ═══════════════════════════════════════════════════════════════
-- ScholarKit: FULL WIPE + DEMO RESEED SCRIPT
-- Run this ONCE to prepare for a live demo.
-- ═══════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 0;

-- 1. WIPE ALL TRANSACTIONAL DATA (order matters due to FK constraints)
TRUNCATE TABLE cart_items;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE price_history_log;
TRUNCATE TABLE seller_notifications;
TRUNCATE TABLE school_bundles;
TRUNCATE TABLE products;
TRUNCATE TABLE sellers;
TRUNCATE TABLE users;
-- Keep schools — they are reference data, but reset auto-increment
TRUNCATE TABLE schools;

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════
-- 2. RESEED: SCHOOLS (These are the 3 campus catalogs)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO schools (id, name, location, added_by_seller) VALUES
  (1, 'Shiv Nadar School',     'Noida',    NULL),
  (2, 'The Knowledge Habitat', 'Delhi',    NULL),
  (3, 'Amity International',   'Gurugram', NULL);

-- ═══════════════════════════════════════════════════════════════
-- 3. RESEED: USERS (3 roles — password for all is 'Demo@1234')
--    bcrypt hash for 'Demo@1234' with 10 rounds:
-- ═══════════════════════════════════════════════════════════════
-- The hash below is pre-generated. We will replace it right after
-- with a Node.js script that generates fresh hashes.
-- For now, use a placeholder that gets overwritten.

-- We will insert users via a Node script to get proper bcrypt hashes.
-- This section is handled by the seed script below.

SELECT 'Database wiped successfully. Run the Node.js seed script next.' AS status;
