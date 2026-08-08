import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';
import { verifySession } from '@/lib/session';

export async function GET(request: NextRequest) {
  // 备份包含全库数据（含 users.password_hash），仅管理员可访问
  const session = await verifySession(request.cookies.get('auth_token')?.value);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  }

  const client = getClient();
  const lines: string[] = [];

  lines.push('-- ============================================================');
  lines.push('-- 内部耗材管理系统 - 数据库数据备份');
  lines.push('-- 生成时间: ' + new Date().toLocaleString('zh-CN'));
  lines.push('-- 说明: 本文件包含完整数据备份');
  lines.push('--       导入前请先执行 supabase-init.sql 创建表结构');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('-- 先清空数据（按外键依赖顺序）');
  lines.push('TRUNCATE sales_order_items, sales_orders,');
  lines.push('         purchase_order_items, purchase_orders,');
  lines.push('         products, customers, suppliers');
  lines.push('         CASCADE;');
  lines.push('');
  lines.push('-- 重置自增序列');
  lines.push('ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;');
  lines.push('ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;');
  lines.push('ALTER SEQUENCE IF EXISTS suppliers_id_seq RESTART WITH 1;');
  lines.push('ALTER SEQUENCE IF EXISTS sales_orders_id_seq RESTART WITH 1;');
  lines.push('ALTER SEQUENCE IF EXISTS sales_order_items_id_seq RESTART WITH 1;');
  lines.push('ALTER SEQUENCE IF EXISTS purchase_orders_id_seq RESTART WITH 1;');
  lines.push('ALTER SEQUENCE IF EXISTS purchase_order_items_id_seq RESTART WITH 1;');
  lines.push('ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;');
  lines.push('');

  function q(val: unknown): string {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return String(val);
    // escape single quotes
    return "'" + String(val).replace(/'/g, "''") + "'";
  }

  async function dumpTable(table: string, columns: string[]) {
    const { data, error } = await client.from(table).select('*').order('id');
    if (error || !data) return;
    lines.push(`-- ${table}: ${data.length} 条记录`);
    for (const row of data) {
      const vals = columns.map(c => q(row[c])).join(', ');
      lines.push(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${vals});`);
    }
    lines.push('');
  }

  await dumpTable('products', ['id','code','name','spec','unit','price','sale_price','init_qty','created_at','updated_at']);
  await dumpTable('customers', ['id','name','phone','contact','remark','created_at','updated_at','address','bank','account']);
  await dumpTable('suppliers', ['id','name','created_at','updated_at','address','bank','account','phone','contact','remark']);
  await dumpTable('sales_orders', ['id','bill_no','date','customer_id','customer_name','total','created_at','verified']);
  await dumpTable('sales_order_items', ['id','order_id','product_id','product_name','spec','unit','price','qty','amount']);
  await dumpTable('purchase_orders', ['id','bill_no','date','supplier_id','supplier_name','total','created_at']);
  await dumpTable('purchase_order_items', ['id','order_id','product_id','product_name','spec','unit','price','qty','amount']);
  await dumpTable('users', ['id','username','password_hash','display_name','role','created_at','updated_at']);

  lines.push('-- ============================================================');
  lines.push('-- 备份完成');
  lines.push('-- ============================================================');

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="data-backup.sql"',
    },
  });
}
