-- ═══════════════════════════════════════════════════════════════
-- ScholarKit: PRE-DEMO HISTORICAL DATA
-- Run 10 minutes before the presentation, AFTER demo_seed.js.
-- This adds fake order history so analytics views have data,
-- and stages the "Trigger Demo" product.
-- ═══════════════════════════════════════════════════════════════

-- ─── STEP 1: Insert 3 past orders for the Customer (user_id=3) ───
INSERT INTO orders (user_id, total_amount, shipping_fee, status, created_at) VALUES
  (3, 1098.00, 0.00, 'Delivered', NOW() - INTERVAL 5 DAY),
  (3,  948.00, 50.00, 'Delivered', NOW() - INTERVAL 3 DAY),
  (3, 1847.00, 0.00, 'Shipped',   NOW() - INTERVAL 1 DAY);

-- ─── STEP 2: Insert order_items for those orders ───
-- Order 1: Customer bought 1x White Cotton Shirt (id=1, ₹499) + 1x Grey Trousers (id=2, ₹599)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
  (1, 1, 1, 499.00),
  (1, 2, 1, 599.00);

-- Order 2: Customer bought 1x Canvas Shoes (id=11, ₹899) from Knowledge Habitat
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
  (2, 11, 1, 899.00);

-- Order 3: Customer bought 1x School Blazer (id=3, ₹1299) + 1x Cream Formal Shirt (id=13, ₹549)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
  (3, 3, 1, 1299.00),
  (3, 13, 1, 549.00);

-- ─── STEP 3: Decrement stock for the sold items (mimic real sales) ───
UPDATE products SET stock = stock - 1 WHERE id IN (1, 2, 11, 3, 13);

-- ─── STEP 4: Stage THE TRIGGER DEMO ───
-- Set "Rain Jacket (Yellow)" (id=18, Amity) stock to exactly 12.
-- During the live demo, the customer will buy quantity=3,
-- dropping it from 12 → 9 (below 10), firing the `after_stock_depletion` trigger.
UPDATE products SET stock = 12 WHERE id = 18;

-- ─── STEP 5: Add a price change to generate Price History ───
-- Update one product's price to fire the `before_product_price_update` trigger
UPDATE products SET price = 549.00 WHERE id = 1; -- White Cotton Shirt: 499 → 549

SELECT 'Pre-demo data seeded successfully!' AS status;
