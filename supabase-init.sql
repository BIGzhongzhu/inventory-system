-- ============================================================
-- 内部耗材管理系统 - 数据库初始化脚本
-- 适用于 Supabase PostgreSQL
-- 
-- 使用方法：
--   1. 登录 Supabase 控制台 → SQL Editor
--   2. 复制本文件全部内容并执行
--   3. 默认管理员账号：admin / 88888888
-- ============================================================

-- 启用 pgcrypto 扩展（用于密码加密）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. 创建表
-- ============================================================

-- 耗材产品表
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  spec VARCHAR(200),
  unit VARCHAR(20) NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC NOT NULL DEFAULT 0,
  init_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 部门表（原客户表）
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  contact VARCHAR,
  remark VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  address VARCHAR,
  bank VARCHAR,
  account VARCHAR
);

-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  address VARCHAR,
  bank VARCHAR,
  account VARCHAR,
  phone VARCHAR,
  contact VARCHAR,
  remark VARCHAR
);

-- 出库订单表（原销售订单表）
CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  bill_no VARCHAR NOT NULL,
  date VARCHAR NOT NULL,
  customer_id INTEGER NOT NULL,
  customer_name VARCHAR,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified BOOLEAN DEFAULT false
);

-- 出库订单明细表
CREATE TABLE IF NOT EXISTS sales_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name VARCHAR,
  spec VARCHAR,
  unit VARCHAR,
  price NUMERIC NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0
);

-- 进货订单表
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  bill_no VARCHAR NOT NULL,
  date VARCHAR NOT NULL,
  supplier_id INTEGER NOT NULL,
  supplier_name VARCHAR,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 进货订单明细表
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name VARCHAR,
  spec VARCHAR,
  unit VARCHAR,
  price NUMERIC NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. 创建索引
-- ============================================================

-- 产品表索引
CREATE INDEX IF NOT EXISTS products_code_idx ON products (code);
CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);

-- 部门表索引
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (name);

-- 供应商表索引
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON suppliers (name);

-- 出库订单索引
CREATE INDEX IF NOT EXISTS sales_orders_date_idx ON sales_orders (date);
CREATE INDEX IF NOT EXISTS sales_orders_customer_id_idx ON sales_orders (customer_id);
CREATE INDEX IF NOT EXISTS sales_orders_bill_no_idx ON sales_orders (bill_no);

-- 出库订单明细索引
CREATE INDEX IF NOT EXISTS sales_order_items_order_id_idx ON sales_order_items (order_id);
CREATE INDEX IF NOT EXISTS sales_order_items_product_id_idx ON sales_order_items (product_id);

-- 进货订单索引
CREATE INDEX IF NOT EXISTS purchase_orders_date_idx ON purchase_orders (date);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_id_idx ON purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_bill_no_idx ON purchase_orders (bill_no);

-- 进货订单明细索引
CREATE INDEX IF NOT EXISTS purchase_order_items_order_id_idx ON purchase_order_items (order_id);
CREATE INDEX IF NOT EXISTS purchase_order_items_product_id_idx ON purchase_order_items (product_id);

-- 用户表唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);

-- ============================================================
-- 3. 创建数据库函数
-- ============================================================

-- 密码哈希函数
CREATE OR REPLACE FUNCTION crypt_hash(input_password TEXT)
RETURNS TEXT AS $$
  SELECT crypt(input_password, gen_salt('bf'));
$$ LANGUAGE SQL STRICT;

-- 密码验证函数
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN AS $$
  SELECT crypt(input_password, stored_hash) = stored_hash;
$$ LANGUAGE SQL STRICT;

-- ============================================================
-- 4. 清空业务数据（确保初始化为空库）
-- ============================================================

-- 按外键依赖顺序删除：先删明细，再删订单，最后删基础数据
TRUNCATE sales_order_items, sales_orders,
         purchase_order_items, purchase_orders,
         products, customers, suppliers
         CASCADE;

-- 重置自增序列，使新数据从 1 开始
ALTER SEQUENCE IF EXISTS sales_order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sales_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS suppliers_id_seq RESTART WITH 1;

-- ============================================================
-- 5. 插入默认管理员用户
-- ============================================================

-- 默认账号：admin / 88888888（使用 bcrypt 加密）
INSERT INTO users (username, password_hash, display_name, role)
VALUES (
  'admin',
  crypt_hash('88888888'),
  '管理员',
  'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 完成！
-- ============================================================
