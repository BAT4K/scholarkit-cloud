SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
ALTER TABLE IF EXISTS ONLY public.school_requirements DROP CONSTRAINT IF EXISTS school_requirements_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.school_requirements DROP CONSTRAINT IF EXISTS school_requirements_grade_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_school_id_fkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.grade_groups DROP CONSTRAINT IF EXISTS grade_groups_school_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS unique_cart_item;
ALTER TABLE IF EXISTS ONLY public.schools DROP CONSTRAINT IF EXISTS schools_pkey;
ALTER TABLE IF EXISTS ONLY public.school_requirements DROP CONSTRAINT IF EXISTS school_requirements_pkey;
ALTER TABLE IF EXISTS ONLY public.school_requirements DROP CONSTRAINT IF EXISTS school_requirements_grade_group_id_product_id_gender_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.grade_groups DROP CONSTRAINT IF EXISTS grade_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.schools ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.school_requirements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.grade_groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cart_items ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.schools_id_seq;
DROP TABLE IF EXISTS public.schools;
DROP SEQUENCE IF EXISTS public.school_requirements_id_seq;
DROP TABLE IF EXISTS public.school_requirements;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.orders_id_seq;
DROP TABLE IF EXISTS public.orders;
DROP SEQUENCE IF EXISTS public.order_items_id_seq;
DROP TABLE IF EXISTS public.order_items;
DROP SEQUENCE IF EXISTS public.grade_groups_id_seq;
DROP TABLE IF EXISTS public.grade_groups;
DROP SEQUENCE IF EXISTS public.cart_items_id_seq;
DROP TABLE IF EXISTS public.cart_items;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE public.cart_items (
    id integer NOT NULL,
    user_id integer,
    product_id integer,
    quantity integer DEFAULT 1,
    size character varying(10),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);
CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;
CREATE TABLE public.grade_groups (
    id integer NOT NULL,
    school_id integer,
    name character varying(100) NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE SEQUENCE public.grade_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.grade_groups_id_seq OWNED BY public.grade_groups.id;
CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer NOT NULL,
    size character varying(10),
    price_at_purchase numeric(10,2) NOT NULL
);
CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;
CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'Paid'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Paid'::character varying, 'Shipped'::character varying, 'Cancelled'::character varying])::text[])))
);
CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;
CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    category character varying(100),
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    stock integer DEFAULT 0,
    school_id integer
);
CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
CREATE TABLE public.school_requirements (
    id integer NOT NULL,
    grade_group_id integer,
    product_id integer,
    gender character varying(20),
    is_mandatory boolean DEFAULT true,
    CONSTRAINT school_requirements_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Unisex'::character varying])::text[])))
);
CREATE SEQUENCE public.school_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.school_requirements_id_seq OWNED BY public.school_requirements.id;
CREATE TABLE public.schools (
    id integer NOT NULL,
    name text NOT NULL,
    location text,
    image_url text
);
CREATE SEQUENCE public.schools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.schools_id_seq OWNED BY public.schools.id;
CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'parent'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['parent'::character varying, 'admin'::character varying])::text[])))
);
CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);
ALTER TABLE ONLY public.grade_groups ALTER COLUMN id SET DEFAULT nextval('public.grade_groups_id_seq'::regclass);
ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);
ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
ALTER TABLE ONLY public.school_requirements ALTER COLUMN id SET DEFAULT nextval('public.school_requirements_id_seq'::regclass);
ALTER TABLE ONLY public.schools ALTER COLUMN id SET DEFAULT nextval('public.schools_id_seq'::regclass);
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
INSERT INTO public.grade_groups (id, school_id, name, sort_order, created_at) VALUES (1, 1, 'Foundation (K-2)', 10, '2026-02-07 15:44:51.919634');
INSERT INTO public.grade_groups (id, school_id, name, sort_order, created_at) VALUES (2, 1, 'Primary (3-5)', 20, '2026-02-07 15:44:51.919634');
INSERT INTO public.grade_groups (id, school_id, name, sort_order, created_at) VALUES (3, 1, 'Senior (6-12)', 30, '2026-02-07 15:44:51.919634');
INSERT INTO public.order_items (id, order_id, product_id, quantity, size, price_at_purchase) VALUES (1, 20, 34, 2, 'M', 500.00);
INSERT INTO public.order_items (id, order_id, product_id, quantity, size, price_at_purchase) VALUES (2, 21, 2, 2, 'M', 500.00);
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (11, 1, 599.00, 'Shipped', '2026-02-07 19:31:55.982533');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (1, 1, 599.00, 'Paid', '2026-02-07 17:53:09.666895');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (5, 1, 599.00, 'Paid', '2026-02-07 19:26:52.657525');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (6, 1, 599.00, 'Paid', '2026-02-07 19:27:20.181179');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (7, 1, 3098.00, 'Paid', '2026-02-07 19:27:43.288363');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (8, 1, 599.00, 'Paid', '2026-02-07 19:28:31.370818');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (9, 1, 599.00, 'Paid', '2026-02-07 19:31:04.253556');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (10, 1, 5597.00, 'Paid', '2026-02-07 19:31:47.265411');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (12, 1, 599.00, 'Paid', '2026-02-08 01:20:44.492687');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (13, 1, 599.00, 'Paid', '2026-02-08 02:54:12.891816');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (14, 1, 599.00, 'Paid', '2026-02-08 04:27:36.856121');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (15, 1, 599.00, 'Paid', '2026-02-08 05:41:09.405405');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (16, 1, 599.00, 'Paid', '2026-02-08 17:27:21.895716');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (20, 1, 1000.00, 'Paid', '2026-02-09 14:46:22.970685');
INSERT INTO public.orders (id, user_id, total_amount, status, created_at) VALUES (21, 2, 1000.00, 'Paid', '2026-02-18 03:53:25.277262');
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (1, 'Belt', 500.00, 'Uniform', '/products/sns/sns-belt-unisex.webp', '2026-02-09 14:43:48.397935', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (3, 'Housetshirt Green', 500.00, 'Uniform', '/products/sns/sns-housetshirt-green-unisex.webp', '2026-02-09 14:43:48.41569', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (4, 'Housetshirt Red', 500.00, 'Uniform', '/products/sns/sns-housetshirt-red-unisex.webp', '2026-02-09 14:43:48.421777', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (5, 'Housetshirt Yellow', 500.00, 'Uniform', '/products/sns/sns-housetshirt-yellow-unisex.webp', '2026-02-09 14:43:48.428349', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (6, 'Shirt', 500.00, 'Uniform', '/products/sns/sns-shirt-female-senior.webp', '2026-02-09 14:43:48.434734', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (7, 'Shirt', 500.00, 'Uniform', '/products/sns/sns-shirt-male-senior.webp', '2026-02-09 14:43:48.438082', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (8, 'Shirt', 500.00, 'Uniform', '/products/sns/sns-shirt-unisex-foundation.webp', '2026-02-09 14:43:48.441077', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (9, 'Shirt', 500.00, 'Uniform', '/products/sns/sns-shirt-unisex-primary.webp', '2026-02-09 14:43:48.444007', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (10, 'Shorts', 500.00, 'Uniform', '/products/sns/sns-shorts-male-foundation.webp', '2026-02-09 14:43:48.446831', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (11, 'Shorts', 500.00, 'Uniform', '/products/sns/sns-shorts-male-primary.webp', '2026-02-09 14:43:48.449626', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (12, 'Skirt', 500.00, 'Uniform', '/products/sns/sns-skirt-female-foundation.webp', '2026-02-09 14:43:48.452592', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (13, 'Skirt', 500.00, 'Uniform', '/products/sns/sns-skirt-female-primary.webp', '2026-02-09 14:43:48.455712', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (14, 'Socks', 500.00, 'Uniform', '/products/sns/sns-socks-unisex.webp', '2026-02-09 14:43:48.458955', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (15, 'Trouser', 500.00, 'Uniform', '/products/sns/sns-trouser-female-senior.webp', '2026-02-09 14:43:48.465089', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (16, 'Trouser', 500.00, 'Uniform', '/products/sns/sns-trouser-male-senior.webp', '2026-02-09 14:43:48.467968', 100, 1);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (17, 'Belt', 500.00, 'Uniform', '/products/ais/ais-belt-unisex.png', '2026-02-09 14:43:48.470958', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (18, 'Housetshirt Blue', 500.00, 'Uniform', '/products/ais/ais-housetshirt-blue-unisex.png', '2026-02-09 14:43:48.476794', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (19, 'Housetshirt Green', 500.00, 'Uniform', '/products/ais/ais-housetshirt-green-unisex.png', '2026-02-09 14:43:48.482035', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (20, 'Housetshirt Red', 500.00, 'Uniform', '/products/ais/ais-housetshirt-red-unisex.png', '2026-02-09 14:43:48.487493', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (21, 'Housetshirt Yellow', 500.00, 'Uniform', '/products/ais/ais-housetshirt-yellow-unisex.png', '2026-02-09 14:43:48.492836', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (22, 'Shirt', 500.00, 'Uniform', '/products/ais/ais-shirt-female-senior.png', '2026-02-09 14:43:48.498058', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (23, 'Shirt', 500.00, 'Uniform', '/products/ais/ais-shirt-male-senior.png', '2026-02-09 14:43:48.500881', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (24, 'Shirt', 500.00, 'Uniform', '/products/ais/ais-shirt-unisex-foundation.png', '2026-02-09 14:43:48.503616', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (25, 'Shirt', 500.00, 'Uniform', '/products/ais/ais-shirt-unisex-primary.png', '2026-02-09 14:43:48.506362', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (26, 'Shorts', 500.00, 'Uniform', '/products/ais/ais-shorts-male-foundation.png', '2026-02-09 14:43:48.508975', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (27, 'Shorts', 500.00, 'Uniform', '/products/ais/ais-shorts-male-primary.png', '2026-02-09 14:43:48.511552', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (28, 'Skirt', 500.00, 'Uniform', '/products/ais/ais-skirt-female-foundation.png', '2026-02-09 14:43:48.514235', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (29, 'Skirt', 500.00, 'Uniform', '/products/ais/ais-skirt-female-primary.png', '2026-02-09 14:43:48.516845', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (30, 'Socks', 500.00, 'Uniform', '/products/ais/ais-socks-unisex.png', '2026-02-09 14:43:48.519536', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (31, 'Trouser', 500.00, 'Uniform', '/products/ais/ais-trouser-female-senior.png', '2026-02-09 14:43:48.524724', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (32, 'Trouser', 500.00, 'Uniform', '/products/ais/ais-trouser-male-senior.png', '2026-02-09 14:43:48.527311', 100, 2);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (33, 'Belt', 500.00, 'Uniform', '/products/tkhs/tkhs-belt-unisex.webp', '2026-02-09 14:43:48.530167', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (35, 'Housetshirt Green', 500.00, 'Uniform', '/products/tkhs/tkhs-housetshirt-green-unisex.webp', '2026-02-09 14:43:48.540129', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (36, 'Housetshirt Red', 500.00, 'Uniform', '/products/tkhs/tkhs-housetshirt-red-unisex.webp', '2026-02-09 14:43:48.545106', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (37, 'Housetshirt White', 500.00, 'Uniform', '/products/tkhs/tkhs-housetshirt-white-unisex.webp', '2026-02-09 14:43:48.550108', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (38, 'Shirt', 500.00, 'Uniform', '/products/tkhs/tkhs-shirt-female-senior.webp', '2026-02-09 14:43:48.555161', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (39, 'Shirt', 500.00, 'Uniform', '/products/tkhs/tkhs-shirt-male-senior.webp', '2026-02-09 14:43:48.55782', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (40, 'Shirt', 500.00, 'Uniform', '/products/tkhs/tkhs-shirt-unisex-foundation.webp', '2026-02-09 14:43:48.560705', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (41, 'Shirt', 500.00, 'Uniform', '/products/tkhs/tkhs-shirt-unisex-primary.webp', '2026-02-09 14:43:48.563607', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (42, 'Shorts', 500.00, 'Uniform', '/products/tkhs/tkhs-shorts-male-foundation.webp', '2026-02-09 14:43:48.566313', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (43, 'Shorts', 500.00, 'Uniform', '/products/tkhs/tkhs-shorts-male-primary.webp', '2026-02-09 14:43:48.56892', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (44, 'Skirt', 500.00, 'Uniform', '/products/tkhs/tkhs-skirt-female-foundation.webp', '2026-02-09 14:43:48.571559', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (45, 'Skirt', 500.00, 'Uniform', '/products/tkhs/tkhs-skirt-female-primary.webp', '2026-02-09 14:43:48.574247', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (46, 'Socks', 500.00, 'Uniform', '/products/tkhs/tkhs-socks-unisex.webp', '2026-02-09 14:43:48.577091', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (47, 'Trouser', 500.00, 'Uniform', '/products/tkhs/tkhs-trouser-female-senior.webp', '2026-02-09 14:43:48.582314', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (48, 'Trouser', 500.00, 'Uniform', '/products/tkhs/tkhs-trouser-male-senior.webp', '2026-02-09 14:43:48.584978', 100, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (34, 'Housetshirt Blue', 500.00, 'Uniform', '/products/tkhs/tkhs-housetshirt-blue-unisex.webp', '2026-02-09 14:43:48.535177', 98, 3);
INSERT INTO public.products (id, name, price, category, image_url, created_at, stock, school_id) VALUES (2, 'Housetshirt Blue', 500.00, 'Uniform', '/products/sns/sns-housetshirt-blue-unisex.webp', '2026-02-09 14:43:48.407472', 98, 1);
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (1, 1, 1, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (2, 2, 1, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (3, 3, 1, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (4, 1, 2, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (5, 2, 2, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (6, 3, 2, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (7, 1, 3, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (8, 2, 3, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (9, 3, 3, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (10, 1, 4, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (11, 2, 4, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (12, 3, 4, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (13, 1, 5, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (14, 2, 5, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (15, 3, 5, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (16, 3, 6, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (17, 3, 7, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (18, 1, 8, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (19, 2, 9, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (20, 1, 10, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (21, 2, 11, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (22, 1, 12, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (23, 2, 13, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (24, 1, 14, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (25, 2, 14, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (26, 3, 14, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (27, 3, 15, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (28, 3, 16, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (29, 1, 17, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (30, 2, 17, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (31, 3, 17, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (32, 1, 18, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (33, 2, 18, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (34, 3, 18, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (35, 1, 19, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (36, 2, 19, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (37, 3, 19, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (38, 1, 20, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (39, 2, 20, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (40, 3, 20, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (41, 1, 21, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (42, 2, 21, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (43, 3, 21, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (44, 3, 22, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (45, 3, 23, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (46, 1, 24, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (47, 2, 25, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (48, 1, 26, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (49, 2, 27, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (50, 1, 28, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (51, 2, 29, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (52, 1, 30, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (53, 2, 30, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (54, 3, 30, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (55, 3, 31, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (56, 3, 32, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (57, 1, 33, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (58, 2, 33, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (59, 3, 33, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (60, 1, 34, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (61, 2, 34, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (62, 3, 34, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (63, 1, 35, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (64, 2, 35, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (65, 3, 35, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (66, 1, 36, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (67, 2, 36, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (68, 3, 36, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (69, 1, 37, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (70, 2, 37, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (71, 3, 37, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (72, 3, 38, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (73, 3, 39, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (74, 1, 40, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (75, 2, 41, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (76, 1, 42, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (77, 2, 43, 'Male', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (78, 1, 44, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (79, 2, 45, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (80, 1, 46, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (81, 2, 46, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (82, 3, 46, 'Unisex', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (83, 3, 47, 'Female', 't');
INSERT INTO public.school_requirements (id, grade_group_id, product_id, gender, is_mandatory) VALUES (84, 3, 48, 'Male', 't');
INSERT INTO public.schools (id, name, location, image_url) VALUES (1, 'Shiv Nadar School', 'Noida', '/schools/shiv-nadar.webp');
INSERT INTO public.schools (id, name, location, image_url) VALUES (2, 'Amity International School', 'Noida', '/schools/amity.png');
INSERT INTO public.schools (id, name, location, image_url) VALUES (3, 'The Knowledge Habitat School', 'Noida', '/schools/knowledge.svg');
INSERT INTO public.users (id, name, email, password_hash, role, created_at) VALUES (1, 'Test Parent', 'parent@test.com', '$2b$10$DvwAlYlMoXbgAY8GnVAEhufvq9N2rscNQwG1hw9JAev/lwr/lQtEu', 'parent', '2026-02-07 16:12:50.710212');
INSERT INTO public.users (id, name, email, password_hash, role, created_at) VALUES (2, 'admin', 'admin@scholarkit.com', '$2b$10$RwesfHdc7Kgfd9QhTlFFmOnNJqkmDMicKTH3OQA/6sXL.4Xv8u9NK', 'admin', '2026-02-07 20:03:44.753031');
SELECT pg_catalog.setval('public.cart_items_id_seq', 2, true);
SELECT pg_catalog.setval('public.grade_groups_id_seq', 3, true);
SELECT pg_catalog.setval('public.order_items_id_seq', 2, true);
SELECT pg_catalog.setval('public.orders_id_seq', 21, true);
SELECT pg_catalog.setval('public.products_id_seq', 48, true);
SELECT pg_catalog.setval('public.school_requirements_id_seq', 84, true);
SELECT pg_catalog.setval('public.schools_id_seq', 3, true);
SELECT pg_catalog.setval('public.users_id_seq', 2, true);
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.grade_groups
    ADD CONSTRAINT grade_groups_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.school_requirements
    ADD CONSTRAINT school_requirements_grade_group_id_product_id_gender_key UNIQUE (grade_group_id, product_id, gender);
ALTER TABLE ONLY public.school_requirements
    ADD CONSTRAINT school_requirements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT unique_cart_item UNIQUE (user_id, product_id, size);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.grade_groups
    ADD CONSTRAINT grade_groups_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);
ALTER TABLE ONLY public.school_requirements
    ADD CONSTRAINT school_requirements_grade_group_id_fkey FOREIGN KEY (grade_group_id) REFERENCES public.grade_groups(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.school_requirements
    ADD CONSTRAINT school_requirements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;