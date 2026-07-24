-- ============================================================
-- 内部耗材管理系统 - 数据库数据备份
-- 生成时间: 2026/7/24 08:26:28
-- 说明: 本文件包含完整数据备份
--       导入前请先执行 supabase-init.sql 创建表结构
-- ============================================================

-- 先清空数据（按外键依赖顺序）
TRUNCATE sales_order_items, sales_orders,
         purchase_order_items, purchase_orders,
         products, customers, suppliers
         CASCADE;

-- 重置自增序列
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS suppliers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sales_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sales_order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS purchase_order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- products: 70 条记录
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (553, '1', '通用印机粉', '12A.88A', '支', 7.5, 35, 0, '2026-06-22T20:47:59.906333+08:00', '2026-06-22T20:56:26.906+08:00');
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (554, '2', '12A硒鼓', '12A', '支', 36, 120, 0, '2026-06-22T20:47:59.906333+08:00', '2026-06-22T20:56:36.197+08:00');
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (555, '3', '88A硒鼓', '88A', '支', 36, 120, 0, '2026-06-22T20:47:59.906333+08:00', '2026-06-22T22:07:35.127+08:00');
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (556, '4', '三联三等份打印纸', '3X3', '包', 65, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (557, '5', '三联五等份打印纸', '3X5', '包', 66, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (558, '6', '三联二等份打印纸', '3X2', '包', 67, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (559, '7', '快递费用', '1', '次', 8, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (560, '8', '柯尼卡复印机保养耗材', '1', '次', 500, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (561, '9', '夏普复印机粉', '1', '支', 260, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (562, '10', '28A碳粉', '28A', '支', 12, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (563, '11', '震旦369S复印机粉', '369s', '支', 120, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (564, '12', '88A打印机粉', '88A', '支', 9.9, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (565, '13', 'SK-860色带', 'SK-860', '个', 38, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (566, '14', '805墨盒黑色', '805', '个', 65, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (567, '15', '805墨盒彩色', '805', '个', 65, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (568, '16', '夏普复印机粉', '2202', '支', 280, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (569, '17', 'SONY电池', 'DSC-W830', '个', 80, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (570, '18', '交换机', '', '个', 85, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (571, '19', '硬盘', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (572, '20', '内存条', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (573, '21', '打印机切换器', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (574, '22', '803墨盒黑色', '803', '个', 100, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (575, '23', '803墨盒彩色', '803', '个', 100, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (576, '24', '110A硒鼓', '110A', '个', 94, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (577, '25', '103A硒鼓', '103A', '个', 240, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (578, '26', '218A硒鼓', '218A硒鼓', '个', 180, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (579, '27', '得力620K色带', '620K', '个', 35, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (580, '28', '730K色带', '730K', '个', 10, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (581, '29', '键盘', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (582, '30', '路由器', '千兆', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (583, '31', '110A打印机粉', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (584, '32', '28A硒鼓', '28A硒鼓', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (585, '33', 'M104a', '打印机粉', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (586, '34', '柯尼卡367复印机粉', '367', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (587, '35', '鼠标垫', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (588, '36', '开关', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (589, '37', '103A打印机粉', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (590, '38', '打印纸', '57*40', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (591, '39', '打印纸', '57*50', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (592, '40', '色带', 'ERC09', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (593, '41', '色带', 'ERC39', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (594, '42', '硒鼓芯片', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (595, '43', '电容笔', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (596, '44', '218A打印机粉', '218A', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (597, '45', '支架', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (598, '46', 'USB扩展器', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (599, '47', '118A打印机硒鼓', '118A', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (600, '48', 'U盘', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (601, '49', '118A打印机粉', '118A', '套', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (602, '50', 'USB延长线', '', '米', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (603, '51', '电脑电源', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (604, '52', '串口线', '', '米', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (605, '53', '读卡器', '', '只', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (606, '54', '键鼠套装', '', '套', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (607, '55', 'SD卡', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (608, '56', 'TF卡', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (609, '57', '605K色带', '605K', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (610, '58', '显示器', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (611, '59', '电池', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (612, '60', 'HP178nw(150a)', '', '个', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (613, '61', '803墨盒套装', '803', '套', 218, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (614, '62', '打印机纸80mm', '', '卷', 8, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (615, '63', '数据线', '', '根', 0, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (616, '64', '佳能墨水(彩色)', 'GI-890(彩色)', '瓶', 54, 84, 0, '2026-06-22T20:47:59.906333+08:00', '2026-06-22T22:08:15.944+08:00');
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (617, '65', '佳能墨水(黑色)', 'GI-890(黑色)', '瓶', 58, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (618, '66', '标签打印机', '标签打印机', '个', 200, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (619, '67', '色带', 'ERC05', '支', 10, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (620, '68', '硒鼓', 'W1660A', '支', 35, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (621, '69', '网卡', '', '个', 40, 0, 0, '2026-06-22T20:47:59.906333+08:00', NULL);
INSERT INTO products (id, code, name, spec, unit, price, sale_price, init_qty, created_at, updated_at) VALUES (622, '70', '便利贴', '400 张/包', '个', 1.7, 3.4, 0, '2026-06-23T16:01:43.947447+08:00', NULL);

-- customers: 16 条记录
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (19, '总经办', '6218', '侯延霞', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (20, '财务部', '6321', '黄贤慧', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (21, '商贸中心', '6101-6003', '刘丹、甘云云', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (22, '工程部', '5190', '万思宇', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (23, '提取', '5094', '周志林', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (24, '制剂', '9140', '王超', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (25, '生产技术', '6122', '秦晓红', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (26, '质量保证部', '6319', '陈良华', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (27, '质量控制部', '9105', '丁玉春', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (28, '药研所', '8327', '张芳', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (29, '采购', '6006', '张建英', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (30, '仓库', '5113', '罗玲玲', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (31, '自己', '6217', '万宣', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (32, '黄琴', '6210', '黄琴', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (33, '合成', '', '邹阳', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');
INSERT INTO customers (id, name, phone, contact, remark, created_at, updated_at, address, bank, account) VALUES (34, '中试', '', '', '', '2026-06-22T20:47:59.944377+08:00', NULL, '', '', '');

-- suppliers: 4 条记录
INSERT INTO suppliers (id, name, created_at, updated_at, address, bank, account, phone, contact, remark) VALUES (1, '京东', '2026-06-22T20:47:59.988786+08:00', NULL, '', '', '', '', '', '');
INSERT INTO suppliers (id, name, created_at, updated_at, address, bank, account, phone, contact, remark) VALUES (2, '淘宝', '2026-06-22T20:47:59.988786+08:00', NULL, '', '', '', '', '', '');
INSERT INTO suppliers (id, name, created_at, updated_at, address, bank, account, phone, contact, remark) VALUES (3, '南昌佳鑫', '2026-06-22T20:47:59.988786+08:00', NULL, '', '', '', '', '', '');
INSERT INTO suppliers (id, name, created_at, updated_at, address, bank, account, phone, contact, remark) VALUES (4, '南昌迈拓', '2026-06-22T20:47:59.988786+08:00', NULL, '', '', '', '', '', '');

-- sales_orders: 2 条记录
INSERT INTO sales_orders (id, bill_no, date, customer_id, customer_name, total, created_at, verified) VALUES (1, 'XS20260622001', '2026-06-22', 19, '总经办', 35, '2026-06-22T21:17:12.315209+08:00', false);
INSERT INTO sales_orders (id, bill_no, date, customer_id, customer_name, total, created_at, verified) VALUES (3, 'XS20260623002', '2026-06-23', 19, '总经办', 35, '2026-06-23T15:57:08.453719+08:00', false);

-- sales_order_items: 2 条记录
INSERT INTO sales_order_items (id, order_id, product_id, product_name, spec, unit, price, qty, amount) VALUES (1, 1, 553, '通用印机粉', '12A.88A', '支', 35, 1, 35);
INSERT INTO sales_order_items (id, order_id, product_id, product_name, spec, unit, price, qty, amount) VALUES (2, 3, 553, '通用印机粉', '12A.88A', '支', 35, 1, 35);

-- purchase_orders: 2 条记录
INSERT INTO purchase_orders (id, bill_no, date, supplier_id, supplier_name, total, created_at) VALUES (1, 'JH20260622001', '2026-06-22', 1, '京东', 22.5, '2026-06-22T20:57:04.559429+08:00');
INSERT INTO purchase_orders (id, bill_no, date, supplier_id, supplier_name, total, created_at) VALUES (2, 'JH20260622002', '2026-06-22', 1, '京东', 7.5, '2026-06-22T23:09:05.1736+08:00');

-- purchase_order_items: 2 条记录
INSERT INTO purchase_order_items (id, order_id, product_id, product_name, spec, unit, price, qty, amount) VALUES (1, 1, 553, '通用印机粉', '12A.88A', '支', 7.5, 3, 22.5);
INSERT INTO purchase_order_items (id, order_id, product_id, product_name, spec, unit, price, qty, amount) VALUES (2, 2, 553, '通用印机粉', '12A.88A', '支', 7.5, 1, 7.5);

-- users: 1 条记录
INSERT INTO users (id, username, password_hash, display_name, role, created_at, updated_at) VALUES (1, 'wanxuan1987', '$2a$06$GHwRh6diMOq.WW33w9MN2OKjyOjkAldmX.377T2SJpaI4widfDWh2', '万宣', 'admin', '2026-06-22T22:33:02.47657+08:00', '2026-06-22T23:03:36.191+08:00');

-- ============================================================
-- 备份完成
-- ============================================================