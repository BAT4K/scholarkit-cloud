-- ============================================================
-- ScholarKit v2 Migration: Discounts, Recommendations, Shipping
-- Run this in DBeaver BEFORE restarting the backend.
--
-- INSTRUCTIONS FOR DBEAVER:
--   1. Open this file in DBeaver's SQL editor.
--   2. Run each section one at a time (highlight the block, then Ctrl+Enter).
--   3. For the PROCEDURE at the bottom, set DBeaver's delimiter
--      to $$ first (see comment there).
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. DISCOUNT MANAGEMENT
-- ────────────────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN discount_percent INT NOT NULL DEFAULT 0;

-- Set a few sample discounts so the UI is visible during the demo
UPDATE products SET discount_percent = 15 WHERE id IN (1, 17, 33);   -- Belts
UPDATE products SET discount_percent = 10 WHERE id IN (14, 30, 46);  -- Socks


-- ────────────────────────────────────────────────────────────
-- 2. PERSONALIZED RECOMMENDATIONS (Advanced SQL View)
--    Recommends products from the same school(s) the
--    user has previously purchased from, excluding items
--    already bought.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_user_recommendations AS
SELECT
  u.id                   AS user_id,
  p.id                   AS product_id,
  p.name                 AS product_name,
  p.price                AS product_price,
  p.category             AS product_category,
  p.stock                AS product_stock,
  p.discount_percent     AS product_discount,
  s.name                 AS school_name,
  s.id                   AS school_id
FROM users u
-- Find all schools the user has ordered from
JOIN (
    SELECT DISTINCT o.user_id, p2.school_id
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p2    ON p2.id = oi.product_id
) user_schools ON user_schools.user_id = u.id
-- Get all products from those schools
JOIN products p ON p.school_id = user_schools.school_id
JOIN schools  s ON s.id = p.school_id
-- Exclude products the user has already purchased
WHERE p.id NOT IN (
    SELECT oi2.product_id
    FROM orders o2
    JOIN order_items oi2 ON oi2.order_id = o2.id
    WHERE o2.user_id = u.id
)
AND p.stock > 0;


-- ────────────────────────────────────────────────────────────
-- 3. SHIPPING COSTS & TRACKING
-- ────────────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN shipping_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN tracking_number  VARCHAR(100)  DEFAULT NULL;


-- ────────────────────────────────────────────────────────────
-- 4. UPDATE PlaceOrder STORED PROCEDURE
--
--    ⚠️  IN DBEAVER: Before running this block, go to the
--        SQL Editor toolbar and change the Statement Delimiter
--        from ";" to "$$"  (or right-click → Execute → set delimiter).
--        After running, change it back to ";".
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS PlaceOrder$$

CREATE PROCEDURE PlaceOrder(IN p_user_id INT)
BEGIN
  DECLARE v_subtotal DECIMAL(10,2);
  DECLARE v_shipping DECIMAL(10,2) DEFAULT 0.00;
  DECLARE v_order_id INT;

  -- Ensure the cart is not empty
  IF (SELECT COUNT(*) FROM cart_items WHERE user_id = p_user_id) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot checkout: Your cart is empty.';
  END IF;

  START TRANSACTION;

  -- Calculate subtotal from cart
  SELECT SUM(p.price * c.quantity)
    INTO v_subtotal
    FROM cart_items c
    JOIN products p ON p.id = c.product_id
   WHERE c.user_id = p_user_id;

  -- Apply shipping fee if subtotal < 1000
  IF v_subtotal < 1000 THEN
    SET v_shipping = 50.00;
  END IF;

  -- Create the order row
  INSERT INTO orders (user_id, total_amount, shipping_fee, status)
    VALUES (p_user_id, v_subtotal + v_shipping, v_shipping, 'Paid');

  SET v_order_id = LAST_INSERT_ID();

  -- Copy cart items into order_items
  INSERT INTO order_items (order_id, product_id, quantity, size, price_at_purchase)
    SELECT v_order_id, c.product_id, c.quantity, c.size, p.price
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
     WHERE c.user_id = p_user_id;

  -- Decrement stock
  UPDATE products p
    JOIN cart_items c ON c.product_id = p.id AND c.user_id = p_user_id
     SET p.stock = p.stock - c.quantity;

  -- Clear the cart
  DELETE FROM cart_items WHERE user_id = p_user_id;

  COMMIT;
END$$
