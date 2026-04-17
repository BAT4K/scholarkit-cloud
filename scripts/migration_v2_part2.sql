-- This file uses DELIMITER which works in MySQL CLI
-- Run with: mysql -u root -p scholarkit_dbms < this_file.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS PlaceOrder$$

CREATE PROCEDURE PlaceOrder(IN p_user_id INT)
BEGIN
  DECLARE v_subtotal DECIMAL(10,2);
  DECLARE v_shipping DECIMAL(10,2) DEFAULT 0.00;
  DECLARE v_order_id INT;

  IF (SELECT COUNT(*) FROM cart_items WHERE user_id = p_user_id) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot checkout: Your cart is empty.';
  END IF;

  START TRANSACTION;

  SELECT SUM(p.price * c.quantity)
    INTO v_subtotal
    FROM cart_items c
    JOIN products p ON p.id = c.product_id
   WHERE c.user_id = p_user_id;

  IF v_subtotal < 1000 THEN
    SET v_shipping = 50.00;
  END IF;

  INSERT INTO orders (user_id, total_amount, shipping_fee, status)
    VALUES (p_user_id, v_subtotal + v_shipping, v_shipping, 'Paid');

  SET v_order_id = LAST_INSERT_ID();

  INSERT INTO order_items (order_id, product_id, quantity, size, price_at_purchase)
    SELECT v_order_id, c.product_id, c.quantity, c.size, p.price
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
     WHERE c.user_id = p_user_id;

  UPDATE products p
    JOIN cart_items c ON c.product_id = p.id AND c.user_id = p_user_id
     SET p.stock = p.stock - c.quantity;

  DELETE FROM cart_items WHERE user_id = p_user_id;

  COMMIT;
END$$

DELIMITER ;
