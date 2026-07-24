import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, numeric, index, serial } from "drizzle-orm/pg-core";

// System table - DO NOT DELETE
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Products table
export const products = pgTable(
  "products",
  {
    id: serial().primaryKey(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    spec: varchar("spec", { length: 200 }),
    unit: varchar("unit", { length: 20 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    sale_price: numeric("sale_price", { precision: 10, scale: 2 }).notNull().default("0"),
    init_qty: integer("init_qty").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("products_code_idx").on(table.code),
    index("products_name_idx").on(table.name),
  ]
);

// Customers table
export const customers = pgTable(
  "customers",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 100 }),
    address: varchar("address", { length: 300 }),
    contact: varchar("contact", { length: 100 }),
    bank: varchar("bank", { length: 200 }),
    account: varchar("account", { length: 100 }),
    remark: varchar("remark", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("customers_name_idx").on(table.name),
  ]
);

// Suppliers table
export const suppliers = pgTable(
  "suppliers",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 100 }),
    address: varchar("address", { length: 300 }),
    contact: varchar("contact", { length: 100 }),
    bank: varchar("bank", { length: 200 }),
    account: varchar("account", { length: 100 }),
    remark: varchar("remark", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("suppliers_name_idx").on(table.name),
  ]
);

// Sales orders table
export const salesOrders = pgTable(
  "sales_orders",
  {
    id: serial().primaryKey(),
    order_no: varchar("order_no", { length: 50 }).notNull(),
    customer_id: integer("customer_id"),
    customer_name: varchar("customer_name", { length: 200 }),
    total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    order_date: varchar("order_date", { length: 20 }),
    remark: varchar("remark", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("sales_orders_order_no_idx").on(table.order_no),
    index("sales_orders_customer_id_idx").on(table.customer_id),
  ]
);

// Sales order items table
export const salesOrderItems = pgTable(
  "sales_order_items",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull(),
    product_id: integer("product_id").notNull(),
    product_name: varchar("product_name", { length: 200 }),
    spec: varchar("spec", { length: 200 }),
    unit: varchar("unit", { length: 20 }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    quantity: integer("quantity").notNull().default(0),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("sales_order_items_order_id_idx").on(table.order_id),
  ]
);

// Purchase orders table
export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: serial().primaryKey(),
    order_no: varchar("order_no", { length: 50 }).notNull(),
    supplier_id: integer("supplier_id"),
    supplier_name: varchar("supplier_name", { length: 200 }),
    total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    order_date: varchar("order_date", { length: 20 }),
    remark: varchar("remark", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("purchase_orders_order_no_idx").on(table.order_no),
    index("purchase_orders_supplier_id_idx").on(table.supplier_id),
  ]
);

// Purchase order items table
export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: serial().primaryKey(),
    order_id: integer("order_id").notNull(),
    product_id: integer("product_id").notNull(),
    product_name: varchar("product_name", { length: 200 }),
    spec: varchar("spec", { length: 200 }),
    unit: varchar("unit", { length: 20 }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    quantity: integer("quantity").notNull().default(0),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  },
  (table) => [
    index("purchase_order_items_order_id_idx").on(table.order_id),
  ]
);

// Consumables table
export const consumables = pgTable(
  "consumables",
  {
    id: serial().primaryKey(),
    product_id: integer("product_id").notNull(),
    product_name: varchar("product_name", { length: 200 }),
    quantity: integer("quantity").notNull().default(0),
    date: varchar("date", { length: 20 }),
    remark: varchar("remark", { length: 500 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("consumables_product_id_idx").on(table.product_id),
  ]
);
