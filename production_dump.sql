-- MySQL dump 10.13  Distrib 8.4.6, for Linux (x86_64)
--
-- Host: localhost    Database: scholarkit_dbms
-- ------------------------------------------------------
-- Server version	8.4.6

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `size` varchar(50) DEFAULT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `price_at_purchase` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,1,499.00),(2,1,2,1,599.00),(3,2,11,1,899.00),(4,3,3,1,1299.00),(5,3,13,1,549.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tracking_number` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,3,1098.00,'Delivered','2026-04-12 01:12:10',0.00,NULL),(2,3,948.00,'Delivered','2026-04-14 01:12:10',50.00,NULL),(3,3,1847.00,'Shipped','2026-04-16 01:12:10',0.00,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_history_log`
--

DROP TABLE IF EXISTS `price_history_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_history_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `old_price` decimal(10,2) DEFAULT NULL,
  `new_price` decimal(10,2) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `price_history_log_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_history_log`
--

LOCK TABLES `price_history_log` WRITE;
/*!40000 ALTER TABLE `price_history_log` DISABLE KEYS */;
INSERT INTO `price_history_log` VALUES (1,1,499.00,549.00,'2026-04-17 01:12:10');
/*!40000 ALTER TABLE `price_history_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` int DEFAULT NULL,
  `school_id` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `category` varchar(100) DEFAULT NULL,
  `grade_group` enum('foundation','primary','secondary','all') DEFAULT NULL,
  `discount_percent` int NOT NULL DEFAULT '0',
  `image_url` varchar(500) DEFAULT NULL,
  `size` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seller_id` (`seller_id`),
  KEY `school_id` (`school_id`),
  FULLTEXT KEY `name` (`name`,`category`),
  FULLTEXT KEY `name_2` (`name`,`category`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,1,'White Cotton Shirt',549.00,49,'Shirt','primary',0,NULL,'M'),(2,1,1,'Grey Trousers',599.00,39,'Trouser','primary',10,NULL,'M'),(3,1,1,'School Blazer (Navy)',1299.00,24,'Blazer','secondary',0,NULL,'L'),(4,1,1,'Sports T-Shirt (House)',399.00,60,'Sportswear','all',15,NULL,'M'),(5,1,1,'Black Leather Belt',249.00,80,'Accessory','all',0,NULL,'Free Size'),(6,1,1,'Tie (Striped)',199.00,70,'Accessory','secondary',5,NULL,'Free Size'),(7,1,2,'Sky Blue Polo Shirt',549.00,45,'Shirt','primary',0,NULL,'M'),(8,1,2,'Navy Cargo Shorts',449.00,35,'Shorts','foundation',0,NULL,'S'),(9,1,2,'Checked Pinafore Dress',699.00,30,'Dress','foundation',10,NULL,'S'),(10,1,2,'Track Pants (Navy)',499.00,55,'Sportswear','all',0,NULL,'L'),(11,1,2,'Canvas Shoes (White)',899.00,39,'Footwear','all',20,NULL,'Free Size'),(12,1,2,'Winter Sweater (V-Neck)',799.00,20,'Winterwear','all',0,NULL,'L'),(13,1,3,'Cream Formal Shirt',549.00,49,'Shirt','secondary',5,NULL,'M'),(14,1,3,'Charcoal Trousers',649.00,45,'Trouser','secondary',0,NULL,'L'),(15,1,3,'House T-Shirt (Red)',349.00,65,'Sportswear','all',0,NULL,'M'),(16,1,3,'PE Shorts',299.00,70,'Sportswear','all',0,NULL,'M'),(17,1,3,'School Socks (Pack of 3)',199.00,100,'Accessory','all',10,NULL,'Free Size'),(18,1,3,'Rain Jacket (Yellow)',999.00,12,'Outerwear','all',0,NULL,'L');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_product_price_update` BEFORE UPDATE ON `products` FOR EACH ROW BEGIN
    -- Only log it if the price actually changed
    IF OLD.price <> NEW.price THEN
        INSERT INTO price_history_log (product_id, old_price, new_price)
        VALUES (OLD.id, OLD.price, NEW.price);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_stock_depletion` AFTER UPDATE ON `products` FOR EACH ROW BEGIN
    -- If stock drops below 10, fire an alert to the seller
    IF NEW.stock < 10 AND OLD.stock >= 10 THEN
        INSERT INTO seller_notifications (seller_id, message)
        VALUES (NEW.seller_id, CONCAT('URGENT: Stock for ', NEW.name, ' has dropped to ', NEW.stock));
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `school_bundles`
--

DROP TABLE IF EXISTS `school_bundles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_bundles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_id` int DEFAULT NULL,
  `bundle_name` varchar(100) DEFAULT NULL,
  `bundle_contents` json DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `school_bundles_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school_bundles`
--

LOCK TABLES `school_bundles` WRITE;
/*!40000 ALTER TABLE `school_bundles` DISABLE KEYS */;
/*!40000 ALTER TABLE `school_bundles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schools`
--

DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `added_by_seller` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `added_by_seller` (`added_by_seller`),
  CONSTRAINT `schools_ibfk_1` FOREIGN KEY (`added_by_seller`) REFERENCES `sellers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schools`
--

LOCK TABLES `schools` WRITE;
/*!40000 ALTER TABLE `schools` DISABLE KEYS */;
INSERT INTO `schools` VALUES (1,'Shiv Nadar School','Noida',1),(2,'The Knowledge Habitat','Delhi',1),(3,'Amity International','Gurugram',1);
/*!40000 ALTER TABLE `schools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_notifications`
--

DROP TABLE IF EXISTS `seller_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seller_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `seller_id` int DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_notifications`
--

LOCK TABLES `seller_notifications` WRITE;
/*!40000 ALTER TABLE `seller_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `seller_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sellers`
--

DROP TABLE IF EXISTS `sellers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sellers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `sellers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sellers`
--

LOCK TABLES `sellers` WRITE;
/*!40000 ALTER TABLE `sellers` DISABLE KEYS */;
INSERT INTO `sellers` VALUES (1,2,'ScholarKit Uniforms Pvt. Ltd.','9876543210');
/*!40000 ALTER TABLE `sellers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('customer','admin','seller') DEFAULT 'customer',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `phone_encrypted` varbinary(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@scholarkit.com','$2b$10$fV3NBBINgM98IU8cuLz8ruqWbDpD8J4vaxTnVdm.TLidgyYIaSJTC','admin','2026-04-17 06:35:10',NULL),(2,'Ravi Kumar','seller@scholarkit.com','$2b$10$fV3NBBINgM98IU8cuLz8ruqWbDpD8J4vaxTnVdm.TLidgyYIaSJTC','seller','2026-04-17 06:35:10',NULL),(3,'Priya Sharma','parent@scholarkit.com','$2b$10$fV3NBBINgM98IU8cuLz8ruqWbDpD8J4vaxTnVdm.TLidgyYIaSJTC','customer','2026-04-17 06:35:10',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_critical_stock`
--

DROP TABLE IF EXISTS `vw_critical_stock`;
/*!50001 DROP VIEW IF EXISTS `vw_critical_stock`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_critical_stock` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `stock`,
 1 AS `company_name`,
 1 AS `school_name`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_top_products_per_school`
--

DROP TABLE IF EXISTS `vw_top_products_per_school`;
/*!50001 DROP VIEW IF EXISTS `vw_top_products_per_school`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_top_products_per_school` AS SELECT 
 1 AS `school_name`,
 1 AS `product_name`,
 1 AS `total_sold`,
 1 AS `sales_rank`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_user_recommendations`
--

DROP TABLE IF EXISTS `vw_user_recommendations`;
/*!50001 DROP VIEW IF EXISTS `vw_user_recommendations`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_user_recommendations` AS SELECT 
 1 AS `user_id`,
 1 AS `product_id`,
 1 AS `product_name`,
 1 AS `product_price`,
 1 AS `product_category`,
 1 AS `product_stock`,
 1 AS `product_discount`,
 1 AS `school_name`,
 1 AS `school_id`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'scholarkit_dbms'
--
/*!50003 DROP FUNCTION IF EXISTS `CalculateGST` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateGST`(original_price DECIMAL(10,2)) RETURNS decimal(10,2)
    DETERMINISTIC
BEGIN
    DECLARE tax_rate DECIMAL(4,2);
    -- Let's assume an 18% tax rate for uniforms
    SET tax_rate = 0.18; 
    RETURN original_price * tax_rate;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `CalculateTotalInventoryValue` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `CalculateTotalInventoryValue`()
BEGIN
  -- Declare variables for the cursor
  DECLARE v_price DECIMAL(10,2);
  DECLARE v_stock INT;
  DECLARE v_total_value DECIMAL(15,2) DEFAULT 0.00;
  DECLARE v_done INT DEFAULT 0;

  -- Declare the CURSOR (iterates every row in products)
  DECLARE product_cursor CURSOR FOR
    SELECT price, stock FROM products;

  -- Declare CONTINUE HANDLER for end-of-data
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  -- Open the cursor
  OPEN product_cursor;

  -- Loop through every product row
  read_loop: LOOP
    FETCH product_cursor INTO v_price, v_stock;
    IF v_done THEN
      LEAVE read_loop;
    END IF;
    SET v_total_value = v_total_value + (v_price * v_stock);
  END LOOP;

  -- Close the cursor
  CLOSE product_cursor;

  -- Return the result
  SELECT v_total_value AS total_inventory_value;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `PlaceOrder` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `PlaceOrder`(IN p_user_id INT)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vw_critical_stock`
--

/*!50001 DROP VIEW IF EXISTS `vw_critical_stock`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_critical_stock` AS select `p`.`id` AS `id`,`p`.`name` AS `name`,`p`.`stock` AS `stock`,`s`.`company_name` AS `company_name`,`sch`.`name` AS `school_name` from ((`products` `p` join `sellers` `s` on((`p`.`seller_id` = `s`.`id`))) join `schools` `sch` on((`p`.`school_id` = `sch`.`id`))) where (`p`.`stock` < 15) order by `p`.`stock` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_top_products_per_school`
--

/*!50001 DROP VIEW IF EXISTS `vw_top_products_per_school`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_top_products_per_school` AS with `RankedProducts` as (select `p`.`school_id` AS `school_id`,`sch`.`name` AS `school_name`,`p`.`name` AS `product_name`,sum(`oi`.`quantity`) AS `total_sold`,row_number() OVER (PARTITION BY `p`.`school_id` ORDER BY sum(`oi`.`quantity`) desc )  AS `sales_rank` from ((`products` `p` join `order_items` `oi` on((`p`.`id` = `oi`.`product_id`))) join `schools` `sch` on((`p`.`school_id` = `sch`.`id`))) group by `p`.`school_id`,`sch`.`name`,`p`.`id`) select `RankedProducts`.`school_name` AS `school_name`,`RankedProducts`.`product_name` AS `product_name`,`RankedProducts`.`total_sold` AS `total_sold`,`RankedProducts`.`sales_rank` AS `sales_rank` from `RankedProducts` where (`RankedProducts`.`sales_rank` <= 3) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_user_recommendations`
--

/*!50001 DROP VIEW IF EXISTS `vw_user_recommendations`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_user_recommendations` AS select `u`.`id` AS `user_id`,`p`.`id` AS `product_id`,`p`.`name` AS `product_name`,`p`.`price` AS `product_price`,`p`.`category` AS `product_category`,`p`.`stock` AS `product_stock`,`p`.`discount_percent` AS `product_discount`,`s`.`name` AS `school_name`,`s`.`id` AS `school_id` from (((`users` `u` join (select distinct `o`.`user_id` AS `user_id`,`p2`.`school_id` AS `school_id` from ((`orders` `o` join `order_items` `oi` on((`oi`.`order_id` = `o`.`id`))) join `products` `p2` on((`p2`.`id` = `oi`.`product_id`)))) `user_schools` on((`user_schools`.`user_id` = `u`.`id`))) join `products` `p` on((`p`.`school_id` = `user_schools`.`school_id`))) join `schools` `s` on((`s`.`id` = `p`.`school_id`))) where (`p`.`id` in (select `oi2`.`product_id` from (`orders` `o2` join `order_items` `oi2` on((`oi2`.`order_id` = `o2`.`id`))) where (`o2`.`user_id` = `u`.`id`)) is false and (`p`.`stock` > 0)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-17  7:00:02
