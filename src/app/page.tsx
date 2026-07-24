'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Product {
  id: number;
  code: string;
  name: string;
  spec: string | null;
  unit: string;
  price: string;
  sale_price: string;
  init_qty: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  contact: string | null;
  bank: string | null;
  account: string | null;
  remark: string | null;
}

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  contact: string | null;
  bank: string | null;
  account: string | null;
  remark: string | null;
}

interface SalesOrder {
  id: number;
  bill_no: string;
  date: string;
  customer_id: number;
  customer_name: string | null;
  total: string;
  verified: boolean;
  sales_order_items: SalesOrderItem[];
}

interface SalesOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string | null;
  spec: string | null;
  unit: string | null;
  price: string;
  qty: number;
  amount: string;
}

interface PurchaseOrder {
  id: number;
  bill_no: string;
  date: string;
  supplier_id: number;
  supplier_name: string | null;
  total: string;
  purchase_order_items: PurchaseOrderItem[];
}

interface PurchaseOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string | null;
  spec: string | null;
  unit: string | null;
  price: string;
  qty: number;
  amount: string;
}

interface StockItem extends Product {
  purchase_qty: number;
  sales_qty: number;
  stock_qty: number;
}

// API helpers
const api = {
  get: async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} failed`);
    return res.json();
  },
  post: async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${url} failed`);
    return res.json();
  },
  put: async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${url} failed`);
    return res.json();
  },
  del: async (url: string) => {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${url} failed`);
    return res.json();
  },
};

// Auth types
interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: string;
}

// Tabs
const TABS = [
  { key: 'products', label: '耗材管理' },
  { key: 'stock', label: '耗材库存' },
  { key: 'sales', label: '耗材使用单' },
  { key: 'purchases', label: '进货开单' },
  { key: 'salesDetail', label: '出库明细' },
  { key: 'purchaseDetail', label: '进货明细' },
  { key: 'customers', label: '部门管理' },
  { key: 'export', label: '数据导出' },
  { key: 'users', label: '用户管理' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// Setup Page Component - shown when database is not initialized
function SetupPage({ onRecheck }: { onRecheck: () => void }) {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- 内部耗材管理系统 - 数据库初始化脚本
-- 适用于 Supabase PostgreSQL
--
-- 使用方法：
--   1. 登录 Supabase 控制台 → SQL Editor
--   2. 复制本文件全部内容并执行
--   3. 默认管理员账号：admin / 88888888

-- 启用 pgcrypto 扩展（用于密码加密）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 创建表

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

-- 部门表
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

-- 出库订单表
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

-- 2. 创建索引

CREATE INDEX IF NOT EXISTS products_code_idx ON products (code);
CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (name);
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON suppliers (name);
CREATE INDEX IF NOT EXISTS sales_orders_date_idx ON sales_orders (date);
CREATE INDEX IF NOT EXISTS sales_orders_customer_id_idx ON sales_orders (customer_id);
CREATE INDEX IF NOT EXISTS sales_orders_bill_no_idx ON sales_orders (bill_no);
CREATE INDEX IF NOT EXISTS sales_order_items_order_id_idx ON sales_order_items (order_id);
CREATE INDEX IF NOT EXISTS sales_order_items_product_id_idx ON sales_order_items (product_id);
CREATE INDEX IF NOT EXISTS purchase_orders_date_idx ON purchase_orders (date);
CREATE INDEX IF NOT EXISTS purchase_orders_supplier_id_idx ON purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS purchase_orders_bill_no_idx ON purchase_orders (bill_no);
CREATE INDEX IF NOT EXISTS purchase_order_items_order_id_idx ON purchase_order_items (order_id);
CREATE INDEX IF NOT EXISTS purchase_order_items_product_id_idx ON purchase_order_items (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (username);

-- 3. 创建数据库函数

CREATE OR REPLACE FUNCTION crypt_hash(input_password TEXT)
RETURNS TEXT AS $$
  SELECT crypt(input_password, gen_salt('bf'));
$$ LANGUAGE SQL STRICT;

CREATE OR REPLACE FUNCTION verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN AS $$
  SELECT crypt(input_password, stored_hash) = stored_hash;
$$ LANGUAGE SQL STRICT;

-- 4. 插入默认管理员用户（账号：admin / 88888888）

INSERT INTO users (username, password_hash, display_name, role)
VALUES (
  'admin',
  crypt_hash('88888888'),
  '管理员',
  'admin'
) ON CONFLICT (username) DO NOTHING;`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = sqlScript;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8e] to-[#4472C4] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">数据库尚未初始化</h1>
          <p className="text-sm text-gray-500 mt-2">请按照以下步骤完成数据库初始化后刷新页面</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-[#1e3a5f] mb-2 text-sm">操作步骤</h3>
            <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
              <li>登录 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#4472C4] underline">Supabase 控制台</a>，进入你的项目</li>
              <li>点击左侧菜单 <strong>SQL Editor</strong></li>
              <li>点击下方按钮复制初始化 SQL 脚本</li>
              <li>粘贴到 SQL Editor 中，点击 <strong>Run</strong> 执行</li>
              <li>执行成功后，点击下方 &quot;我已完成初始化&quot; 按钮</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              默认管理员账号：<strong>admin</strong> / <strong>88888888</strong>，登录后请立即修改密码
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-[#4472C4] text-white font-medium rounded-lg hover:bg-[#3561b0] transition flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已复制到剪贴板
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                复制初始化 SQL 脚本
              </>
            )}
          </button>

          <button
            onClick={onRecheck}
            className="w-full py-2.5 bg-white text-[#4472C4] font-medium rounded-lg border-2 border-[#4472C4] hover:bg-[#4472C4] hover:text-white transition"
          >
            我已完成初始化，重新检测
          </button>
        </div>
      </div>
    </div>
  );
}

// Login Page Component (no hooks)
function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setLoginError(data.error || '登录失败');
      }
    } catch {
      setLoginError('网络错误');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8e] to-[#4472C4] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-[420px]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#4472C4] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">内部耗材管理系统</h1>
          <p className="text-sm text-gray-500 mt-1">请登录您的账户</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4472C4] focus:border-[#4472C4] outline-none transition text-sm"
              placeholder="请输入用户名"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4472C4] focus:border-[#4472C4] outline-none transition text-sm"
              placeholder="请输入密码"
            />
          </div>
          {loginError && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200">
              {loginError}
            </div>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2.5 bg-[#4472C4] text-white font-medium rounded-lg hover:bg-[#3561b0] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loginLoading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main App Component (always renders same hooks)
function MainApp({ authUser, onLogout }: { authUser: AuthUser; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Load data based on active tab
  const loadData = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      switch (tab) {
        case 'products': {
          const data = await api.get('/api/products');
          setProducts(data);
          break;
        }
        case 'stock': {
          const data = await api.get('/api/stock');
          setStock(data);
          break;
        }
        case 'sales':
        case 'salesDetail': {
          const [p, c, o] = await Promise.all([
            api.get('/api/products'),
            api.get('/api/customers'),
            api.get('/api/sales'),
          ]);
          setProducts(p);
          setCustomers(c);
          setSalesOrders(o);
          break;
        }
        case 'purchases':
        case 'purchaseDetail': {
          const [p, s, o] = await Promise.all([
            api.get('/api/products'),
            api.get('/api/suppliers'),
            api.get('/api/purchases'),
          ]);
          setProducts(p);
          setSuppliers(s);
          setPurchaseOrders(o);
          break;
        }
        case 'customers': {
          const data = await api.get('/api/customers');
          setCustomers(data);
          break;
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Seed data on first load
  useEffect(() => {
    if (!seeded) {
      api.post('/api/seed', {}).then(() => setSeeded(true)).catch(() => setSeeded(true));
    }
  }, [seeded]);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#4472C4] text-white shadow-lg">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wider">内部耗材管理系统</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-90">欢迎，{authUser.displayName || authUser.username}</span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Excel sheet tab style */}
      <nav className="bg-[#D6E4F0] border-b-2 border-[#4472C4]">
        <div className="max-w-[1200px] mx-auto px-2">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-[#4472C4] border-t-2 border-l border-r border-[#4472C4] rounded-t-sm font-bold'
                    : 'text-[#4472C4] hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4472C4]"></div>
            <span className="ml-3 text-[#4472C4]">加载中...</span>
          </div>
        ) : (
          <>
            {activeTab === 'products' && (
              <ProductManagement products={products} onRefresh={() => loadData('products')} />
            )}
            {activeTab === 'stock' && (
              <StockView stock={stock} />
            )}
            {activeTab === 'sales' && (
              <SalesForm
                products={products}
                customers={customers}
                onRefresh={() => loadData('sales')}
              />
            )}
            {activeTab === 'purchases' && (
              <PurchaseForm
                products={products}
                suppliers={suppliers}
                onRefresh={() => loadData('purchases')}
              />
            )}
            {activeTab === 'salesDetail' && (
              <SalesDetail orders={salesOrders} onRefresh={() => loadData('salesDetail')} />
            )}
            {activeTab === 'purchaseDetail' && (
              <PurchaseDetail orders={purchaseOrders} onRefresh={() => loadData('purchaseDetail')} />
            )}
            {activeTab === 'customers' && (
              <CustomerManagement />
            )}
            {activeTab === 'export' && (
              <ExportModule />
            )}
            {activeTab === 'users' && (
              <UserManagement currentUser={authUser} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ============ Product Management ============
function ProductManagement({
  products,
  onRefresh,
}: {
  products: Product[];
  onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ code: '', name: '', spec: '', unit: '个', price: '0', sale_price: '0' });

  const openAdd = () => {
    setEditProduct(null);
    setForm({ code: String(products.length + 1), name: '', spec: '', unit: '个', price: '0', sale_price: '0' });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ code: p.code, name: p.name, spec: p.spec || '', unit: p.unit, price: p.price, sale_price: p.sale_price });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('产品名称不能为空');
    try {
      if (editProduct) {
        await api.put(`/api/products/${editProduct.id}`, form);
      } else {
        await api.post('/api/products', { ...form, init_qty: 0 });
      }
      setShowModal(false);
      onRefresh();
    } catch (e) {
      alert('保存失败: ' + String(e));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此产品？')) return;
    try {
      await api.del(`/api/products/${id}`);
      onRefresh();
    } catch (e) {
      alert('删除失败: ' + String(e));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title">耗材管理</h2>
        <button onClick={openAdd} className="btn-primary">+ 新增产品</button>
      </div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>编号</th>
              <th>名称</th>
              <th>规格</th>
              <th>单位</th>
              <th className="price-col">进货单价</th>
              <th className="price-col">销售单价</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="text-center">{p.code}</td>
                <td className="font-medium">{p.name}</td>
                <td>{p.spec || '-'}</td>
                <td className="text-center">{p.unit}</td>
                <td className="price-col">{Number(p.price).toFixed(2)}</td>
                <td className="price-col">{Number(p.sale_price).toFixed(2)}</td>
                <td className="text-center">
                  <button onClick={() => openEdit(p)} className="btn-link mr-3">编辑</button>
                  <button onClick={() => handleDelete(p.id)} className="btn-danger">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div className="text-center py-10 text-gray-400">暂无产品数据</div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editProduct ? '编辑产品' : '新增产品'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">编号</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">名称</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">规格</label>
                <input value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">单位</label>
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">进货单价</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">销售单价</label>
                <input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-link">取消</button>
              <button onClick={handleSave} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Stock View ============
function StockView({ stock }: { stock: StockItem[] }) {
  return (
    <div>
      <h2 className="section-title">耗材库存</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>编号</th>
              <th>名称</th>
              <th>规格</th>
              <th>单位</th>
              <th className="price-col">进货单价</th>
              <th className="price-col">销售单价</th>
              <th>期初库存</th>
              <th>进货数量</th>
              <th>销售数量</th>
              <th>当前库存</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.id}>
                <td className="text-center">{s.code}</td>
                <td className="font-medium">{s.name}</td>
                <td>{s.spec || '-'}</td>
                <td className="text-center">{s.unit}</td>
                <td className="price-col">{Number(s.price).toFixed(2)}</td>
                <td className="price-col">{Number(s.sale_price).toFixed(2)}</td>
                <td className="text-center">{s.init_qty}</td>
                <td className="text-center" style={{color:'#548235'}}>{s.purchase_qty}</td>
                <td className="text-center" style={{color:'#C00000'}}>{s.sales_qty}</td>
                <td className="text-center font-semibold">{s.stock_qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stock.length === 0 && <div className="text-center py-10 text-gray-400">暂无库存数据</div>}
      </div>
    </div>
  );
}

// ============ Sales Form ============
function SalesForm({
  products,
  customers,
  onRefresh,
}: {
  products: Product[];
  customers: Customer[];
  onRefresh: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<Array<{ product_id: number; product_name: string; spec: string; unit: string; price: string; qty: number; amount: number }>>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showProductBrowseModal, setShowProductBrowseModal] = useState(false);
  const [productBrowseSearch, setProductBrowseSearch] = useState('');

  const addCustomer = async () => {
    if (!newCustomerName.trim()) return;
    try {
      const c = await api.post('/api/customers', { name: newCustomerName, phone: newCustomerPhone });
      setCustomerId(c.id);
      setCustomerName(c.name);
      setShowCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setShowNewCustomerForm(false);
      onRefresh();
    } catch (e) {
      alert('添加部门失败: ' + String(e));
    }
  };

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setShowCustomerModal(false);
    setCustomerSearch('');
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(customerSearch) || (c.phone && c.phone.includes(customerSearch))
  );

  const selectProduct = (p: Product) => {
    const price = Number(p.sale_price || p.price);
    setItems([...items, {
      product_id: p.id,
      product_name: p.name,
      spec: p.spec || '',
      unit: p.unit,
      price: String(price),
      qty: 1,
      amount: price,
    }]);
    setShowProductDropdown(false);
    setSearchQuery('');
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as Record<string, unknown>)[field] = value;
    if (field === 'price' || field === 'qty') {
      newItems[index].amount = Number(newItems[index].price) * newItems[index].qty;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async () => {
    if (!customerId) return alert('请选择使用部门');
    if (items.length === 0) return alert('请添加产品');
    try {
      await api.post('/api/sales', {
        date,
        customer_id: customerId,
        customer_name: customerName,
        total,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          spec: item.spec,
          unit: item.unit,
          price: item.price,
          qty: item.qty,
          amount: item.amount,
        })),
      });
      alert('销售单已保存！');
      setItems([]);
      setCustomerId('');
      setCustomerName('');
      onRefresh();
    } catch (e) {
      alert('保存失败: ' + String(e));
    }
  };

  const filteredProducts = products.filter(
    (p) => p.name.includes(searchQuery) || p.code.includes(searchQuery) || (p.spec && p.spec.includes(searchQuery))
  );

  return (
    <div>
      <h2 className="section-title">耗材使用单</h2>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">使用部门</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCustomerModal(true); setCustomerSearch(''); setShowNewCustomerForm(false); }}
                className="flex-1 border border-[#b4c6e7] rounded-sm px-3 py-1.5 text-sm text-left hover:bg-[#D6E4F0] flex items-center justify-between"
                style={{minHeight:'30px'}}
              >
                <span className={customerName ? 'text-gray-900' : 'text-gray-400'}>{customerName || '点击选择部门'}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">部门名称</label>
            <input value={customerName} readOnly className="bg-[#f2f2f2]" />
          </div>
        </div>

        {/* Product search & add */}
        <div className="mb-4 relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">搜索添加产品</label>
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowProductDropdown(true); }}
              onFocus={() => setShowProductDropdown(true)}
              placeholder="输入产品名称/编号/规格搜索..."
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => { setShowProductBrowseModal(true); setProductBrowseSearch(''); }}
              className="px-3 py-2 text-sm font-medium text-white bg-[#4472C4] hover:bg-[#3560a8] whitespace-nowrap"
              style={{borderRadius:'4px'}}
            >
              浏览全部
            </button>
          </div>
          {showProductDropdown && searchQuery && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-[#4472C4] shadow-lg max-h-60 overflow-auto">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left px-4 py-2 hover:bg-[#D6E4F0] text-sm flex justify-between border-b border-gray-100">
                  <span>{p.code} - {p.name} {p.spec ? `(${p.spec})` : ''}</span>
                  <span className="text-gray-500">进货:{Number(p.price).toFixed(2)} | 销售:{Number(p.sale_price).toFixed(2)}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && <div className="px-4 py-3 text-gray-400 text-sm">未找到产品</div>}
            </div>
          )}
        </div>

        {/* Product browse modal */}
        {showProductBrowseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor:'rgba(0,0,0,0.4)'}}>
            <div className="bg-white shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" style={{border:'2px solid #4472C4',borderRadius:'6px'}}>
              <div className="flex items-center justify-between px-4 py-3 bg-[#4472C4] text-white">
                <h3 className="font-bold text-base">浏览全部产品</h3>
                <button onClick={() => setShowProductBrowseModal(false)} className="text-white hover:text-gray-200 text-xl font-bold">&times;</button>
              </div>
              <div className="px-4 py-2 border-b border-gray-200">
                <input
                  value={productBrowseSearch}
                  onChange={(e) => setProductBrowseSearch(e.target.value)}
                  placeholder="搜索产品名称/编号/规格..."
                  className="w-full"
                  style={{border:'1px solid #b4c6e7',padding:'6px 10px',fontSize:'14px',borderRadius:'4px'}}
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#4472C4] text-white text-sm">
                    <tr>
                      <th className="px-3 py-2 text-center">编号</th>
                      <th className="px-3 py-2 text-center">产品名称</th>
                      <th className="px-3 py-2 text-center">规格</th>
                      <th className="px-3 py-2 text-center">单位</th>
                      <th className="px-3 py-2 text-center">进货单价</th>
                      <th className="px-3 py-2 text-center">销售单价</th>
                      <th className="px-3 py-2 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter((p) =>
                      !productBrowseSearch ||
                      p.name.includes(productBrowseSearch) ||
                      p.code.includes(productBrowseSearch) ||
                      (p.spec && p.spec.includes(productBrowseSearch))
                    ).map((p) => (
                      <tr key={p.id} className="hover:bg-[#D6E4F0] border-b border-gray-100 text-sm">
                        <td className="px-3 py-2">{p.code}</td>
                        <td className="px-3 py-2 font-medium">{p.name}</td>
                        <td className="px-3 py-2 text-gray-600">{p.spec || '-'}</td>
                        <td className="px-3 py-2 text-center">{p.unit}</td>
                        <td className="px-3 py-2 text-right">{Number(p.price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{Number(p.sale_price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => { selectProduct(p); setShowProductBrowseModal(false); }}
                            className="px-3 py-1 text-xs font-medium text-white bg-[#548235] hover:bg-[#375623]"
                            style={{borderRadius:'3px'}}
                          >
                            添加
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Items table - Excel style */}
        <div className="overflow-x-auto mb-4">
          <table>
            <thead>
              <tr>
                <th>产品名称</th>
                <th>规格</th>
                <th>单位</th>
                <th className="price-col">销售单价</th>
                <th>数量</th>
                <th className="price-col">金额</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-medium">{item.product_name}</td>
                  <td>{item.spec}</td>
                  <td className="text-center">{item.unit}</td>
                  <td className="price-col"><input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} className="w-24 text-center" style={{border:'1px solid #b4c6e7',padding:'2px 4px',fontSize:'13px'}} /></td>
                  <td className="text-center"><input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} className="w-20 text-center" style={{border:'1px solid #b4c6e7',padding:'2px 4px',fontSize:'13px'}} /></td>
                  <td className="price-col font-medium">{item.amount.toFixed(2)}</td>
                  <td className="text-center"><button onClick={() => removeItem(idx)} className="btn-danger">删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">请搜索并添加产品</div>}
        </div>

        <div className="flex justify-between items-center pt-4 border-t-2 border-[#4472C4]">
          <div className="text-lg font-bold">合计: <span className="text-amount-total">¥{total.toFixed(2)}</span></div>
          <button onClick={handleSubmit} className="btn-save-order active:scale-95 active:shadow-inner transition-all duration-150">保存出库单</button>
        </div>
      </div>

      {/* Customer Selection Dialog */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" style={{border:'2px solid #4472C4',borderRadius:'4px'}}>
            <div className="flex items-center justify-between px-4 py-3" style={{background:'#4472C4'}}>
              <h3 className="text-base font-bold text-white">选择部门</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="搜索部门名称/电话..."
                autoFocus
              />
              {customerId && (
                <div className="px-3 py-2 bg-[#D6E4F0] text-sm text-[#4472C4] flex items-center justify-between" style={{border:'1px solid #4472C4'}}>
                  <span>已选: {customerName}</span>
                  <button onClick={() => { setCustomerId(''); setCustomerName(''); }} className="text-[#4472C4] hover:text-[#2F5496] text-xs font-medium">清除</button>
                </div>
              )}
              <div className="border border-[#b4c6e7] overflow-y-auto max-h-48">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-[#D6E4F0] text-sm border-b border-gray-100 ${customerId === c.id ? 'bg-[#D6E4F0]' : ''}`}
                    >
                      <div className="font-medium text-gray-900">{c.name}</div>
                      {c.phone && <div className="text-gray-500 text-xs mt-0.5">{c.phone}</div>}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    {customerSearch ? '未找到匹配部门' : '暂无部门'}
                  </div>
                )}
              </div>
              {!showNewCustomerForm ? (
                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  className="w-full py-2 border-2 border-dashed border-[#b4c6e7] text-sm text-[#4472C4] hover:bg-[#D6E4F0]"
                >
                  + 新增部门
                </button>
              ) : (
                <div className="border border-[#4472C4] p-4 bg-[#D6E4F0]/30">
                  <div className="text-sm font-bold text-[#2F5496] mb-3">新增部门</div>
                  <div className="space-y-2">
                    <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="部门名称" />
                    <input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="联系电话（选填）" />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => setShowNewCustomerForm(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">取消</button>
                    <button onClick={addCustomer} className="btn-primary px-3 py-1.5 text-sm">保存并选择</button>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={() => setShowCustomerModal(false)} className="btn-primary px-6 py-1.5">确定</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Purchase Form ============
function PurchaseForm({
  products,
  suppliers,
  onRefresh,
}: {
  products: Product[];
  suppliers: Supplier[];
  onRefresh: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState<Array<{ product_id: number; product_name: string; spec: string; unit: string; price: string; qty: number; amount: number }>>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showProductBrowseModal, setShowProductBrowseModal] = useState(false);
  const [productBrowseSearch, setProductBrowseSearch] = useState('');

  const addSupplier = async () => {
    if (!newSupplierName.trim()) return;
    try {
      const s = await api.post('/api/suppliers', { name: newSupplierName });
      setSupplierId(s.id);
      setSupplierName(s.name);
      setShowSupplierModal(false);
      setNewSupplierName('');
      setShowNewSupplierForm(false);
      onRefresh();
    } catch (e) {
      alert('添加供应商失败: ' + String(e));
    }
  };

  const selectSupplier = (s: Supplier) => {
    setSupplierId(s.id);
    setSupplierName(s.name);
    setShowSupplierModal(false);
    setSupplierSearch('');
  };

  const filteredSuppliers = suppliers.filter(
    (s) => s.name.includes(supplierSearch)
  );

  const selectProduct = (p: Product) => {
    setItems([...items, {
      product_id: p.id,
      product_name: p.name,
      spec: p.spec || '',
      unit: p.unit,
      price: p.price,
      qty: 1,
      amount: Number(p.price),
    }]);
    setShowProductDropdown(false);
    setSearchQuery('');
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as Record<string, unknown>)[field] = value;
    if (field === 'price' || field === 'qty') {
      newItems[index].amount = Number(newItems[index].price) * newItems[index].qty;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async () => {
    if (!supplierId) return alert('请选择供应商');
    if (items.length === 0) return alert('请添加产品');
    try {
      await api.post('/api/purchases', {
        date,
        supplier_id: supplierId,
        supplier_name: supplierName,
        total,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          spec: item.spec,
          unit: item.unit,
          price: item.price,
          qty: item.qty,
          amount: item.amount,
        })),
      });
      alert('进货单已保存！');
      setItems([]);
      setSupplierId('');
      setSupplierName('');
      onRefresh();
    } catch (e) {
      alert('保存失败: ' + String(e));
    }
  };

  const filteredProducts = products.filter(
    (p) => p.name.includes(searchQuery) || p.code.includes(searchQuery) || (p.spec && p.spec.includes(searchQuery))
  );

  return (
    <div>
      <h2 className="inv-section-title">进货开单</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="inv-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSupplierModal(true); setSupplierSearch(''); setShowNewSupplierForm(false); }}
                className="flex-1 border rounded-lg px-3 py-2 text-sm text-left hover:bg-green-50 flex items-center justify-between"
              >
                <span className={supplierName ? 'text-gray-900' : 'text-gray-400'}>{supplierName || '点击选择供应商'}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商名称</label>
            <input value={supplierName} readOnly className="inv-input bg-gray-50" />
          </div>
        </div>

        {/* Product search & add */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">搜索添加产品</label>
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowProductDropdown(true); }}
              onFocus={() => setShowProductDropdown(true)}
              placeholder="输入产品名称/编号/规格搜索..."
              className="inv-input flex-1"
            />
            <button
              type="button"
              onClick={() => { setShowProductBrowseModal(true); setProductBrowseSearch(''); }}
              className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm whitespace-nowrap flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              浏览全部
            </button>
          </div>
          {showProductDropdown && searchQuery && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => selectProduct(p)} className="w-full text-left px-4 py-2 hover:bg-green-50 text-sm flex justify-between">
                  <span>{p.code} - {p.name} {p.spec ? `(${p.spec})` : ''}</span>
                  <span className="text-gray-400">进货价:{Number(p.price).toFixed(2)}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && <div className="px-4 py-3 text-gray-400 text-sm">未找到产品</div>}
            </div>
          )}
        </div>

        {/* Product Browse Modal */}
        {showProductBrowseModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowProductBrowseModal(false)}>
            <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b flex items-center justify-between bg-emerald-600 text-white rounded-t-lg">
                <h3 className="font-bold text-base">浏览全部产品</h3>
                <button onClick={() => setShowProductBrowseModal(false)} className="text-white hover:text-gray-200 text-xl">&times;</button>
              </div>
              <div className="px-4 py-3 border-b">
                <input
                  value={productBrowseSearch}
                  onChange={(e) => setProductBrowseSearch(e.target.value)}
                  placeholder="搜索产品名称/编号/规格..."
                  className="inv-input w-full"
                  autoFocus
                />
              </div>
              <div className="overflow-auto flex-1">
                <table className="inv-table text-sm">
                  <thead>
                    <tr>
                      <th>编号</th>
                      <th>名称</th>
                      <th>规格</th>
                      <th>单位</th>
                      <th>进货单价</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter((p: Product) => {
                      if (!productBrowseSearch) return true;
                      const q = productBrowseSearch.toLowerCase();
                      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.spec || '').toLowerCase().includes(q);
                    }).map((p: Product) => (
                      <tr key={p.id} className="hover:bg-green-50 cursor-pointer" onClick={() => { selectProduct(p); setShowProductBrowseModal(false); setSearchQuery(''); }}>
                        <td>{p.code}</td>
                        <td>{p.name}</td>
                        <td>{p.spec || '-'}</td>
                        <td>{p.unit}</td>
                        <td className="text-center">{Number(p.price).toFixed(2)}</td>
                        <td>
                          <button className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">选择</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Items table */}
        <div className="overflow-x-auto mb-4">
          <table className="inv-table">
            <thead>
              <tr>
                <th>产品名称</th>
                <th>规格</th>
                <th>单位</th>
                <th>进货单价</th>
                <th>数量</th>
                <th>金额</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.product_name}</td>
                  <td>{item.spec}</td>
                  <td>{item.unit}</td>
                  <td><input type="number" step="0.01" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} className="w-24 border rounded px-2 py-1 text-sm text-center" /></td>
                  <td><input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} className="w-20 border rounded px-2 py-1 text-sm text-center" /></td>
                  <td className="text-center font-medium">{item.amount.toFixed(2)}</td>
                  <td><button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800 text-sm">删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">请搜索并添加产品</div>}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold">合计: <span className="inv-amount">¥{total.toFixed(2)}</span></div>
          <button onClick={handleSubmit} className="btn-save-order">保存进货单</button>
        </div>
      </div>

      {/* Supplier Selection Dialog */}
      {showSupplierModal && (
        <div className="inv-modal-overlay">
          <div className="inv-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">选择供应商</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-3">
              <input
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="搜索供应商名称..."
                className="inv-input"
                autoFocus
              />
            </div>
            {supplierId && (
              <div className="mb-3 px-3 py-2 bg-green-50 rounded-lg text-sm text-green-700 flex items-center justify-between">
                <span>已选: {supplierName}</span>
                <button onClick={() => { setSupplierId(''); setSupplierName(''); }} className="text-green-500 hover:text-green-700 text-xs">清除</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
              {filteredSuppliers.length > 0 ? (
                <div className="divide-y">
                  {filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectSupplier(s)}
                      className={`w-full text-left px-4 py-3 hover:bg-green-50 text-sm transition ${supplierId === s.id ? 'bg-green-50 ring-1 ring-green-300' : ''}`}
                    >
                      <div className="font-medium text-gray-900">{s.name}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {supplierSearch ? '未找到匹配供应商' : '暂无供应商'}
                </div>
              )}
            </div>
            {!showNewSupplierForm ? (
              <button
                onClick={() => setShowNewSupplierForm(true)}
                className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-green-400 hover:text-green-500 transition"
              >
                + 新增供应商
              </button>
            ) : (
              <div className="mt-3 border rounded-lg p-4 bg-gray-50">
                <div className="text-sm font-medium text-gray-700 mb-3">新增供应商</div>
                <input
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="供应商名称"
                  className="inv-input"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewSupplierForm(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">取消</button>
                  <button onClick={addSupplier} className="inv-btn-green text-sm px-3 py-1.5">保存并选择</button>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowSupplierModal(false)} className="inv-btn-green">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Sales Detail ============
function SalesDetail({ orders, onRefresh }: { orders: SalesOrder[]; onRefresh: () => void }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOn, setFilterOn] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此销售单？')) return;
    try {
      await api.del(`/api/sales/${id}`);
      onRefresh();
    } catch (e) {
      alert('删除失败: ' + String(e));
    }
  };

  const exportCSV = () => {
    const rows: string[] = ['单号,日期,部门,产品,规格,单位,销售单价,数量,金额'];
    for (const o of orders) {
      for (const item of o.sales_order_items || []) {
        rows.push(`${o.bill_no},${o.date},${o.customer_name || ''},${item.product_name || ''},${item.spec || ''},${item.unit || ''},${item.price},${item.qty},${item.amount}`);
      }
    }
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '出库明细.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Flatten all order items into a single table
  const allRows: { billNo: string; date: string; customer: string; product: string; spec: string; unit: string; price: number; qty: number; amount: number; orderId: number; verified: boolean }[] = [];
  for (const o of orders) {
    for (const item of o.sales_order_items || []) {
      allRows.push({
        billNo: o.bill_no,
        date: o.date,
        customer: o.customer_name || '-',
        product: item.product_name || '',
        spec: item.spec || '-',
        unit: item.unit || '-',
        price: Number(item.price),
        qty: item.qty,
        amount: Number(item.amount),
        orderId: o.id,
        verified: o.verified || false,
      });
    }
  }

  const handleVerify = async (orderId: number) => {
    if (!confirm('确认核销该出库单？')) return;
    try {
      const res = await fetch(`/api/sales/${orderId}/verify`, { method: 'POST' });
      if (!res.ok) throw new Error('核销失败');
      onRefresh();
    } catch (e) {
      alert('核销失败: ' + String(e));
    }
  };
  const handleUnverify = async (orderId: number) => {
    if (!confirm('确认撤销核销？撤销后该出库单将恢复为待核销状态。')) return;
    try {
      const res = await fetch(`/api/sales/${orderId}/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verified: false }) });
      if (!res.ok) throw new Error('撤销核销失败');
      onRefresh();
    } catch (e) {
      alert('撤销核销失败: ' + String(e));
    }
  };
  const totalAmount = allRows.reduce((s, r) => s + r.amount, 0);

  // Date filtering
  const filteredRows = filterOn && (startDate || endDate)
    ? allRows.filter(r => {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        return true;
      })
    : allRows;
  const filteredTotal = filteredRows.reduce((s, r) => s + r.amount, 0);
  const filteredOrderCount = new Set(filteredRows.map(r => r.orderId)).size;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="inv-section-title">出库明细</h2>
        <div className="flex gap-2 items-center">
          <span className="self-center text-sm text-gray-500">共 {filteredOrderCount} 单</span>
          <button onClick={exportCSV} className="inv-btn-green">导出CSV</button>
        </div>
      </div>
      {/* Date filter bar */}
      <div className="flex items-center gap-1.5 mb-3 bg-white px-3 py-2 rounded border border-gray-200 flex-nowrap whitespace-nowrap overflow-x-auto">
        <label className="text-xs font-medium text-gray-600 shrink-0">日期筛选：</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 shrink-0" style={{width:'130px'}} />
        <span className="text-gray-400 text-xs shrink-0">~</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 shrink-0" style={{width:'130px'}} />
        <button onClick={() => setFilterOn(true)} className="shrink-0 bg-[#4472C4] text-white rounded px-3 py-0.5 text-xs font-medium hover:bg-[#3A65B0] transition-colors">查询</button>
        <button onClick={() => { setFilterOn(false); setStartDate(''); setEndDate(''); }}
          className="shrink-0 px-2.5 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors">清除</button>
        {filterOn && (startDate || endDate) && (
          <span className="text-xs text-blue-600 shrink-0">已筛选 {filteredRows.length} 条</span>
        )}
      </div>
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th className="text-center w-10">序号</th>
              <th>单号</th>
              <th>日期</th>
              <th>部门</th>
              <th>产品</th>
              <th>规格</th>
              <th>单位</th>
              <th>出库单价</th>
              <th>数量</th>
              <th style={{ backgroundColor: '#4472C4' }}>金额</th>
              <th className="text-center w-16">核销</th>
              <th className="text-center w-14">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={idx}>
                <td className="text-center text-gray-400">{idx + 1}</td>
                <td className="inv-bill-no">{row.billNo}</td>
                <td>{row.date}</td>
                <td>{row.customer}</td>
                <td>{row.product}</td>
                <td className="text-gray-500">{row.spec}</td>
                <td className="text-gray-500">{row.unit}</td>
                <td>{row.price.toFixed(2)}</td>
                <td>{row.qty}</td>
                <td className="font-medium">{row.amount.toFixed(2)}</td>
                <td className="text-center">
                  {row.verified ? (
                    <button onClick={() => handleUnverify(row.orderId)} className="bg-green-600 text-white rounded px-2 py-1 text-[10px] font-bold hover:bg-green-700 transition-colors whitespace-nowrap">已核销</button>
                  ) : (
                    <button onClick={() => handleVerify(row.orderId)} className="bg-[#4472C4] text-white rounded px-1.5 py-0.5 text-xs hover:bg-[#3A65B0] transition-colors">核销</button>
                  )}
                </td>
                <td className="text-center">
                  <button onClick={() => handleDelete(row.orderId)} className="text-red-600 hover:text-red-800 text-xs">删除</button>
                </td>
              </tr>
            ))}
            {filteredRows.length > 0 && (
              <tr style={{ backgroundColor: '#D9D9D9', fontWeight: 'bold' }}>
                <td colSpan={9} >合计</td>
                <td style={{ backgroundColor: '#4472C4' }}>{filteredTotal.toFixed(2)}</td>
                <td></td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredRows.length === 0 && (
          <div className="text-center py-10 text-gray-400">{filterOn ? '该日期范围内暂无销售记录' : '暂无销售记录'}</div>
        )}
      </div>
    </div>
  );
}

// ============ Purchase Detail ============
function PurchaseDetail({ orders, onRefresh }: { orders: PurchaseOrder[]; onRefresh: () => void }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOn, setFilterOn] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此进货单？')) return;
    try {
      await api.del(`/api/purchases/${id}`);
      onRefresh();
    } catch (e) {
      alert('删除失败: ' + String(e));
    }
  };

  const exportCSV = () => {
    const rows: string[] = ['单号,日期,供应商,产品,规格,单位,进货单价,数量,金额'];
    for (const o of orders) {
      for (const item of o.purchase_order_items || []) {
        rows.push(`${o.bill_no},${o.date},${o.supplier_name || ''},${item.product_name || ''},${item.spec || ''},${item.unit || ''},${item.price},${item.qty},${item.amount}`);
      }
    }
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '进货明细.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Flatten all order items into a single table
  const allRows: { billNo: string; date: string; supplier: string; product: string; spec: string; unit: string; price: number; qty: number; amount: number; orderId: number }[] = [];
  for (const o of orders) {
    for (const item of o.purchase_order_items || []) {
      allRows.push({
        billNo: o.bill_no,
        date: o.date,
        supplier: o.supplier_name || '-',
        product: item.product_name || '',
        spec: item.spec || '-',
        unit: item.unit || '-',
        price: Number(item.price),
        qty: item.qty,
        amount: Number(item.amount),
        orderId: o.id,
      });
    }
  }
  const totalAmount = allRows.reduce((s, r) => s + r.amount, 0);

  // Date filtering
  const filteredRows = filterOn && (startDate || endDate)
    ? allRows.filter(r => {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        return true;
      })
    : allRows;
  const filteredTotal = filteredRows.reduce((s, r) => s + r.amount, 0);
  const filteredOrderCount = new Set(filteredRows.map(r => r.orderId)).size;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="inv-section-title">进货明细</h2>
        <div className="flex gap-2 items-center">
          <span className="self-center text-sm text-gray-500">共 {filteredOrderCount} 单</span>
          <button onClick={exportCSV} className="btn-save-order" style={{ padding: '6px 16px', fontSize: '13px' }}>导出CSV</button>
        </div>
      </div>
      {/* Date filter bar */}
      <div className="flex items-center gap-1.5 mb-3 bg-white px-3 py-2 rounded border border-gray-200 flex-nowrap whitespace-nowrap overflow-x-auto">
        <label className="text-xs font-medium text-gray-600 shrink-0">日期筛选：</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 shrink-0" style={{width:'130px'}} />
        <span className="text-gray-400 text-xs shrink-0">~</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 shrink-0" style={{width:'130px'}} />
        <button onClick={() => setFilterOn(true)} className="shrink-0 bg-[#4472C4] text-white rounded px-3 py-0.5 text-xs font-medium hover:bg-[#3A65B0] transition-colors">查询</button>
        <button onClick={() => { setFilterOn(false); setStartDate(''); setEndDate(''); }}
          className="shrink-0 px-2.5 py-0.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors">清除</button>
        {filterOn && (startDate || endDate) && (
          <span className="text-xs text-blue-600 shrink-0">已筛选 {filteredRows.length} 条</span>
        )}
      </div>
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th className="text-center w-10">序号</th>
              <th>单号</th>
              <th>日期</th>
              <th>供应商</th>
              <th>产品</th>
              <th>规格</th>
              <th>单位</th>
              <th >进货单价</th>
              <th >数量</th>
              <th style={{ backgroundColor: '#4472C4' }}>金额</th>
              <th className="text-center w-14">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={idx}>
                <td className="text-center text-gray-400">{idx + 1}</td>
                <td className="inv-bill-no">{row.billNo}</td>
                <td>{row.date}</td>
                <td>{row.supplier}</td>
                <td>{row.product}</td>
                <td className="text-gray-500">{row.spec}</td>
                <td className="text-gray-500">{row.unit}</td>
                <td >{row.price.toFixed(2)}</td>
                <td >{row.qty}</td>
                <td className="font-medium">{row.amount.toFixed(2)}</td>
                <td className="text-center">
                  <button onClick={() => handleDelete(row.orderId)} className="text-red-600 hover:text-red-800 text-xs">删除</button>
                </td>
              </tr>
            ))}
            {filteredRows.length > 0 && (
              <tr style={{ backgroundColor: '#D9D9D9', fontWeight: 'bold' }}>
                <td colSpan={9} >合计</td>
                <td style={{ backgroundColor: '#4472C4' }}>{filteredTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredRows.length === 0 && (
          <div className="text-center py-10 text-gray-400">{filterOn ? '该日期范围内暂无进货记录' : '暂无进货记录'}</div>
        )}
      </div>
    </div>
  );
}

// ============ Export Module ============
function ExportModule() {
  const [exportType, setExportType] = useState<'sales' | 'purchases' | 'stock'>('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [previewData, setPreviewData] = useState<{
    type: 'sales' | 'purchases' | 'stock';
    items: Array<Record<string, string | number>>;
    summary: Array<Record<string, string | number>>;
    totalAmount: number;
  } | null>(null);

  const handleQuery = async () => {
    setQuerying(true);
    try {
      const params = new URLSearchParams({ type: exportType });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await fetch(`/api/export?${params.toString()}&preview=true`);
      if (!res.ok) throw new Error('查询失败');
      const data = await res.json();
      setPreviewData(data);
    } catch {
      alert('查询失败，请重试');
    } finally {
      setQuerying(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: exportType });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const response = await fetch(`/api/export?${params.toString()}`);
      if (!response.ok) throw new Error('导出失败');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const typeNames: Record<string, string> = { sales: '销售', purchases: '进货', stock: '库存' };
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      a.download = `${typeNames[exportType]}明细_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewTable = () => {
    if (!previewData) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          请选择导出类型和日期范围后，点击"查询"按钮预览数据
        </div>
      );
    }

    if (previewData.items.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          查询范围内暂无数据
        </div>
      );
    }

    const columns = Object.keys(previewData.items[0]);
    const headerBg = exportType === 'sales' ? '#4472C4' : '#375623';
    const highlightCols = ['总价', '合计'];

    return (
      <div>
        {/* 主明细表 */}
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          {previewData.type === 'sales' ? '使用明细' : previewData.type === 'purchases' ? '进货明细' : '耗材库存'}
          <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#888', marginLeft: '8px' }}>
            共 {previewData.items.length} 条记录
          </span>
        </h4>
        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: headerBg, color: '#fff' }}>
                {columns.map((col) => (
                  <th key={col} style={{ border: '1px solid #d0d0d0', padding: '6px 10px', whiteSpace: 'nowrap', textAlign: 'center', background: highlightCols.includes(col) ? '#FFC000' : undefined, color: highlightCols.includes(col) ? '#333' : '#fff' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.items.map((item, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  {columns.map((col) => (
                    <td key={col} style={{ border: '1px solid #d0d0d0', padding: '5px 10px', textAlign: 'center', background: highlightCols.includes(col) ? '#FFF9E6' : undefined }}>
                      {typeof item[col] === 'number' ? item[col].toLocaleString('zh-CN', { minimumFractionDigits: item[col] !== Math.floor(item[col] as number) ? 2 : 0 }) : item[col]}
                    </td>
                  ))}
                </tr>
              ))}
              {previewData.totalAmount > 0 && (
                <tr style={{ background: '#D9D9D9', fontWeight: 'bold' }}>
                  <td colSpan={columns.length - 1} style={{ border: '1px solid #d0d0d0', padding: '6px 10px', textAlign: 'center' }}>合计</td>
                  <td style={{ border: '1px solid #d0d0d0', padding: '6px 10px', textAlign: 'center', color: '#C00000' }}>
                    {previewData.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 汇总表 */}
        {previewData.summary.length > 0 && (
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              品名汇总
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: 'auto', minWidth: '400px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#6C757D', color: '#fff' }}>
                    {Object.keys(previewData.summary[0]).map((col) => (
                      <th key={col} style={{ border: '1px solid #d0d0d0', padding: '6px 10px', whiteSpace: 'nowrap', background: col === '合计' ? '#FFC000' : undefined, color: col === '合计' ? '#333' : '#fff' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.summary.map((item, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      {Object.keys(previewData.summary[0]).map((col) => (
                        <td key={col} style={{ border: '1px solid #d0d0d0', padding: '5px 10px', textAlign: 'center', background: col === '合计' ? '#FFF9E6' : undefined }}>
                          {typeof item[col] === 'number' ? item[col].toLocaleString('zh-CN', { minimumFractionDigits: item[col] !== Math.floor(item[col] as number) ? 2 : 0 }) : item[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{ background: '#D9D9D9', fontWeight: 'bold' }}>
                    <td style={{ border: '1px solid #d0d0d0', padding: '6px 10px' }}>合计</td>
                    <td style={{ border: '1px solid #d0d0d0', padding: '6px 10px', textAlign: 'right' }}>
                      {previewData.summary.reduce((s, i) => s + (typeof i['数量'] === 'number' ? i['数量'] as number : 0), 0)}
                    </td>
                    <td style={{ border: '1px solid #d0d0d0', padding: '6px 10px' }}></td>
                    <td style={{ border: '1px solid #d0d0d0', padding: '6px 10px', textAlign: 'right', color: '#C00000' }}>
                      {previewData.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #4472C4', paddingBottom: '8px' }}>
        数据导出
      </h3>
      <div style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: '4px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'nowrap', alignItems: 'center', whiteSpace: 'nowrap', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px' }}>导出类型：</label>
            <select
              value={exportType}
              onChange={(e) => { setExportType(e.target.value as 'sales' | 'purchases' | 'stock'); setPreviewData(null); }}
              style={{ border: '1px solid #b0b0b0', borderRadius: '3px', padding: '3px 6px', fontSize: '13px' }}
            >
              <option value="sales">出库明细</option>
              <option value="purchases">进货明细</option>
              <option value="stock">耗材库存</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px' }}>起始日期：</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: '1px solid #b0b0b0', borderRadius: '3px', padding: '3px 6px', fontSize: '13px', width: '130px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <label style={{ fontWeight: 'bold', fontSize: '13px' }}>截止日期：</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ border: '1px solid #b0b0b0', borderRadius: '3px', padding: '3px 6px', fontSize: '13px', width: '130px' }}
            />
          </div>
          <button
            onClick={handleQuery}
            disabled={querying}
            style={{
              background: querying ? '#9ca3af' : '#4472C4',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              padding: '6px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: querying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {querying ? '查询中...' : '🔍 查询'}
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#217346',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              padding: '6px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {loading ? '导出中...' : '📥 导出Excel'}
          </button>
        </div>
        {/* 查询结果预览区 */}
        <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
          {renderPreviewTable()}
        </div>
      </div>
    </div>
  );
}


function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number|null>(null);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name:'', phone:'', contact:'', address:'', bank:'', account:'', remark:'' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!addForm.name.trim()) return;
    await fetch('/api/customers', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(addForm) });
    setShowAdd(false);
    setAddForm({ name:'', phone:'', contact:'', address:'', bank:'', account:'', remark:'' });
    loadData();
  };

  const handleUpdate = async (id: number) => {
    await fetch(`/api/customers/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editForm) });
    setEditId(null);
    setEditForm({});
    loadData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/customers/${id}`, { method:'DELETE' });
    setDeleteConfirm(null);
    loadData();
  };

  const startEdit = (c: Customer) => {
    setEditId(c.id);
    setEditForm({ name:c.name, phone:c.phone, contact:c.contact, address:c.address, bank:c.bank, account:c.account, remark:c.remark });
  };

  const filtered = customers.filter(c =>
    c.name.includes(searchTerm) || (c.phone||'').includes(searchTerm) || (c.contact||'').includes(searchTerm)
  );

  const inputCls = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500";

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 border-b-2 border-green-600 pb-1">部门信息管理</h3>
        <div className="flex gap-2">
          <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="搜索部门..." className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-500" />
          <button onClick={()=>setShowAdd(true)} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700 flex items-center gap-1">
            <span className="text-lg leading-none">+</span> 新增部门
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">加载中...</div> : (
      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#4472C4] text-white">
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">序号</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">部门名称</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">电话</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">联系人</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">地址</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">开户银行</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">银行账号</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">备注</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} className={i%2===0?'bg-white':'bg-gray-50'}>
                {editId === c.id ? (
                  <>
                    <td className="border border-gray-300 px-2 py-1 text-center">{i+1}</td>
                    <td className="border border-gray-300 px-1 py-1"><input value={editForm.name||''} onChange={e=>setEditForm({...editForm,name:e.target.value})} className={inputCls} /></td>
                    <td className="border border-gray-300 px-1 py-1"><input value={editForm.phone||''} onChange={e=>setEditForm({...editForm,phone:e.target.value})} className={inputCls} /></td>
                    <td className="border border-gray-300 px-1 py-1"><input value={editForm.contact||''} onChange={e=>setEditForm({...editForm,contact:e.target.value})} className={inputCls} /></td>
                    <td className="border border-gray-300 px-1 py-1"><input value={editForm.address||''} onChange={e=>setEditForm({...editForm,address:e.target.value})} className={inputCls} /></td>
                    <td className="border border-gray-300 px-1 py-1"><input value={editForm.bank||''} onChange={e=>setEditForm({...editForm,bank:e.target.value})} className={inputCls} /></td>
                    <td className="border border-gray-300 px-1 py-1"><input value={editForm.account||''} onChange={e=>setEditForm({...editForm,account:e.target.value})} className={inputCls} /></td>
                    <td className="border border-gray-300 px-1 py-1"><input value={editForm.remark||''} onChange={e=>setEditForm({...editForm,remark:e.target.value})} className={inputCls} /></td>
                    <td className="border border-gray-300 px-2 py-1 text-center whitespace-nowrap">
                      <button onClick={()=>handleUpdate(c.id)} className="bg-green-600 text-white px-2 py-0.5 rounded text-xs mr-1 hover:bg-green-700">保存</button>
                      <button onClick={()=>{setEditId(null);setEditForm({});}} className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs hover:bg-gray-500">取消</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{i+1}</td>
                    <td className="border border-gray-300 px-3 py-1.5 font-medium">{c.name}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{c.phone||'-'}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{c.contact||'-'}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{c.address||'-'}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{c.bank||'-'}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{c.account||'-'}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{c.remark||'-'}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center whitespace-nowrap">
                      {deleteConfirm===c.id ? (
                        <>
                          <span className="text-xs text-red-600 mr-1">确认?</span>
                          <button onClick={()=>handleDelete(c.id)} className="bg-red-600 text-white px-2 py-0.5 rounded text-xs mr-1 hover:bg-red-700">是</button>
                          <button onClick={()=>setDeleteConfirm(null)} className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs hover:bg-gray-500">否</button>
                        </>
                      ) : (
                        <>
                          <button onClick={()=>startEdit(c)} className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs mr-1 hover:bg-blue-700">编辑</button>
                          <button onClick={()=>setDeleteConfirm(c.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs hover:bg-red-600">删除</button>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={9} className="border border-gray-300 text-center py-8 text-gray-400">暂无部门数据</td></tr>}
          </tbody>
        </table>
      </div>
      )}
      <div className="mt-2 text-sm text-gray-500">共 {filtered.length} 条记录</div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setShowAdd(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-4 border-b-2 border-green-600 pb-2">新增部门</h4>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">部门名称 <span className="text-red-500">*</span></label><input value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} className={inputCls} placeholder="请输入部门名称" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">电话</label><input value={addForm.phone} onChange={e=>setAddForm({...addForm,phone:e.target.value})} className={inputCls} placeholder="请输入电话" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">联系人</label><input value={addForm.contact} onChange={e=>setAddForm({...addForm,contact:e.target.value})} className={inputCls} placeholder="请输入联系人" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">地址</label><input value={addForm.address} onChange={e=>setAddForm({...addForm,address:e.target.value})} className={inputCls} placeholder="请输入地址" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">开户银行</label><input value={addForm.bank} onChange={e=>setAddForm({...addForm,bank:e.target.value})} className={inputCls} placeholder="请输入开户银行" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">银行账号</label><input value={addForm.account} onChange={e=>setAddForm({...addForm,account:e.target.value})} className={inputCls} placeholder="请输入银行账号" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">备注</label><textarea value={addForm.remark} onChange={e=>setAddForm({...addForm,remark:e.target.value})} className={inputCls+" h-16 resize-none"} placeholder="请输入备注" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <button onClick={()=>setShowAdd(false)} className="px-4 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700">确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ User Management ============
interface UserRecord {
  id: number;
  username: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

function UserManagement({ currentUser }: { currentUser: AuthUser }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', password: '', displayName: '', role: 'user' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', role: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [fullEditUser, setFullEditUser] = useState<UserRecord | null>(null);
  const [fullEditForm, setFullEditForm] = useState({ username: '', displayName: '', role: '', password: '' });

  const inputCls = "w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4472C4]";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/users');
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAdd = async () => {
    if (!addForm.username.trim() || !addForm.password.trim()) {
      return alert('用户名和密码不能为空');
    }
    try {
      await api.post('/api/users', {
        username: addForm.username,
        password: addForm.password,
        displayName: addForm.displayName || addForm.username,
        role: addForm.role,
      });
      setShowAdd(false);
      setAddForm({ username: '', password: '', displayName: '', role: 'user' });
      loadUsers();
    } catch (e) {
      alert('添加用户失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const startEdit = (u: UserRecord) => {
    setEditId(u.id);
    setEditForm({ displayName: u.display_name || '', role: u.role, password: '' });
  };

  const startFullEdit = (u: UserRecord) => {
    setFullEditUser(u);
    setFullEditForm({ username: u.username, displayName: u.display_name || '', role: u.role, password: '' });
  };

  const handleFullEdit = async () => {
    if (!fullEditUser) return;
    if (!fullEditForm.username.trim()) {
      return alert('用户名不能为空');
    }
    try {
      const body: Record<string, string> = {
        username: fullEditForm.username,
        displayName: fullEditForm.displayName,
        role: fullEditForm.role,
      };
      if (fullEditForm.password.trim()) {
        body.password = fullEditForm.password;
      }
      await api.put(`/api/users/${fullEditUser.id}`, body);
      setFullEditUser(null);
      loadUsers();
    } catch (e) {
      alert('更新用户失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const body: Record<string, string> = {
        displayName: editForm.displayName,
        role: editForm.role,
      };
      if (editForm.password.trim()) {
        body.password = editForm.password;
      }
      await api.put(`/api/users/${id}`, body);
      setEditId(null);
      loadUsers();
    } catch (e) {
      alert('更新用户失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.del(`/api/users/${id}`);
      setDeleteConfirm(null);
      loadUsers();
    } catch (e) {
      alert('删除用户失败: ' + (e instanceof Error ? e.message : '未知错误'));
    }
  };

  const filtered = users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) || (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel = (role: string) => {
    if (role === 'admin') return '管理员';
    if (role === 'user') return '普通用户';
    return role;
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <h2 className="inv-section-title">用户管理</h2>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户名/姓名..."
          className="inv-input"
        />
        <button
          onClick={() => setShowAdd(true)}
          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700"
        >
          新增用户
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="inv-table w-full">
          <thead>
            <tr>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-[#4472C4] text-white">序号</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-[#4472C4] text-white">用户名</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-[#4472C4] text-white">姓名</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-[#4472C4] text-white">角色</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-[#4472C4] text-white">创建时间</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-[#4472C4] text-white">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7fc]'}>
                {editId === u.id ? (
                  <>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{u.username}</td>
                    <td className="border border-gray-300 px-2 py-1.5"><input value={editForm.displayName} onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} className={inputCls} /></td>
                    <td className="border border-gray-300 px-2 py-1.5">
                      <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className={inputCls}>
                        <option value="admin">管理员</option>
                        <option value="user">普通用户</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center whitespace-nowrap">
                      <button onClick={() => handleEdit(u.id)} className="bg-green-600 text-white px-2 py-0.5 rounded text-xs mr-1 hover:bg-green-700">保存</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs hover:bg-gray-500">取消</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-1.5 font-medium">{u.username}</td>
                    <td className="border border-gray-300 px-3 py-1.5">{u.display_name || '-'}</td>
                    <td className="border border-gray-300 px-3 py-1.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center whitespace-nowrap">
                      {u.id === currentUser.id ? (
                        <button onClick={() => startFullEdit(u)} className="bg-[#ED7D31] text-white px-2 py-0.5 rounded text-xs hover:bg-[#D66A1E]">修改全部</button>
                      ) : deleteConfirm === u.id ? (
                        <>
                          <span className="text-xs text-red-600 mr-1">确认?</span>
                          <button onClick={() => handleDelete(u.id)} className="bg-red-600 text-white px-2 py-0.5 rounded text-xs mr-1 hover:bg-red-700">是</button>
                          <button onClick={() => setDeleteConfirm(null)} className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs hover:bg-gray-500">否</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(u)} className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs mr-1 hover:bg-blue-700">编辑</button>
                          <button onClick={() => startFullEdit(u)} className="bg-[#ED7D31] text-white px-2 py-0.5 rounded text-xs mr-1 hover:bg-[#D66A1E]">修改全部</button>
                          <button onClick={() => setDeleteConfirm(u.id)} className="bg-red-500 text-white px-2 py-0.5 rounded text-xs hover:bg-red-600">删除</button>
                        </>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="border border-gray-300 text-center py-8 text-gray-400">暂无用户数据</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-sm text-gray-500">共 {filtered.length} 条记录</div>

      {/* Edit password hint */}
      {editId && (
        <div className="mt-3 text-xs text-gray-500">
          提示：留空密码字段则不修改密码
        </div>
      )}

      {/* Add user dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[450px]" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-4 border-b-2 border-[#4472C4] pb-2">新增用户</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名 <span className="text-red-500">*</span></label>
                <input value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })} className={inputCls} placeholder="请输入用户名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码 <span className="text-red-500">*</span></label>
                <input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} className={inputCls} placeholder="请输入密码" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input value={addForm.displayName} onChange={e => setAddForm({ ...addForm, displayName: e.target.value })} className={inputCls} placeholder="请输入姓名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} className={inputCls}>
                  <option value="admin">管理员</option>
                  <option value="user">普通用户</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleAdd} className="px-4 py-1.5 rounded bg-[#4472C4] text-white text-sm font-medium hover:bg-[#3561b0]">确认添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Full edit user dialog */}
      {fullEditUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setFullEditUser(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[450px]" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold mb-4 border-b-2 border-[#ED7D31] pb-2">修改用户信息</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名 <span className="text-red-500">*</span></label>
                <input value={fullEditForm.username} onChange={e => setFullEditForm({ ...fullEditForm, username: e.target.value })} className={inputCls} placeholder="请输入用户名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input type="password" value={fullEditForm.password} onChange={e => setFullEditForm({ ...fullEditForm, password: e.target.value })} className={inputCls} placeholder="留空则不修改密码" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input value={fullEditForm.displayName} onChange={e => setFullEditForm({ ...fullEditForm, displayName: e.target.value })} className={inputCls} placeholder="请输入姓名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select value={fullEditForm.role} onChange={e => setFullEditForm({ ...fullEditForm, role: e.target.value })} className={inputCls}>
                  <option value="admin">管理员</option>
                  <option value="user">普通用户</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <button onClick={() => setFullEditUser(null)} className="px-4 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50">取消</button>
              <button onClick={handleFullEdit} className="px-4 py-1.5 rounded bg-[#ED7D31] text-white text-sm font-medium hover:bg-[#D66A1E]">确认修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Root component: handles auth state and routing
export default function InventoryApp() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dbInitialized, setDbInitialized] = useState<boolean | null>(null);

  // Check database initialization status
  const checkDbInit = useCallback(async () => {
    try {
      const res = await fetch('/api/setup/check');
      const data = await res.json();
      setDbInitialized(data.initialized === true);
    } catch {
      setDbInitialized(false);
    }
  }, []);

  useEffect(() => {
    checkDbInit();
  }, [checkDbInit]);

  useEffect(() => {
    // Only check auth after DB is confirmed initialized
    if (dbInitialized !== true) return;

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setAuthUser(data.user);
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, [dbInitialized]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
  };

  // Loading state - checking DB
  if (dbInitialized === null) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4472C4]"></div>
      </div>
    );
  }

  // DB not initialized - show setup page
  if (dbInitialized === false) {
    return <SetupPage onRecheck={checkDbInit} />;
  }

  // DB initialized, checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4472C4]"></div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage onLogin={setAuthUser} />;
  }

  return <MainApp authUser={authUser} onLogout={handleLogout} />;
}
