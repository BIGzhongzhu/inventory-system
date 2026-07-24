import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// GET /api/stock - get stock summary (init_qty + purchase_qty - sales_qty per product)
export async function GET() {
  const client = getClient();
  // Get all products
  const { data: products, error: prodError } = await client
    .from('products')
    .select('id, code, name, spec, unit, price, sale_price, init_qty')
    .order('id');
  if (prodError) return NextResponse.json({ error: prodError.message }, { status: 500 });

  // Get all sales items
  const { data: salesItems, error: salesError } = await client
    .from('sales_order_items')
    .select('product_id, qty');
  if (salesError) return NextResponse.json({ error: salesError.message }, { status: 500 });

  // Get all purchase items
  const { data: purchaseItems, error: purchaseError } = await client
    .from('purchase_order_items')
    .select('product_id, qty');
  if (purchaseError) return NextResponse.json({ error: purchaseError.message }, { status: 500 });

  // Calculate stock
  const salesMap = new Map<number, number>();
  for (const item of salesItems || []) {
    salesMap.set(item.product_id, (salesMap.get(item.product_id) || 0) + (item.qty || 0));
  }

  const purchaseMap = new Map<number, number>();
  for (const item of purchaseItems || []) {
    purchaseMap.set(item.product_id, (purchaseMap.get(item.product_id) || 0) + (item.qty || 0));
  }

  const stock = (products || []).map((p) => ({
    ...p,
    purchase_qty: purchaseMap.get(p.id) || 0,
    sales_qty: salesMap.get(p.id) || 0,
    stock_qty: (p.init_qty || 0) + (purchaseMap.get(p.id) || 0) - (salesMap.get(p.id) || 0),
  }));

  return NextResponse.json(stock);
}
