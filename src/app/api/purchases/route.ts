import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// GET /api/purchases - list purchase orders with items
export async function GET() {
  const client = getClient();
  const { data, error } = await client
    .from('purchase_orders')
    .select('*, purchase_order_items(*)')
    .order('id', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/purchases - create purchase order with items
export async function POST(request: Request) {
  const client = getClient();
  const body = await request.json();

  // Generate bill number
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const { count } = await client
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true });
  const billNo = `JH${dateStr}${String((count ?? 0) + 1).padStart(3, '0')}`;

  // Create order
  const { data: order, error: orderError } = await client
    .from('purchase_orders')
    .insert({
      bill_no: billNo,
      date: body.date,
      supplier_id: body.supplier_id,
      supplier_name: body.supplier_name || null,
      total: String(body.total || 0),
    })
    .select()
    .single();
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  // Create order items
  if (body.items && body.items.length > 0) {
    const items = body.items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name || null,
      spec: item.spec || null,
      unit: item.unit || null,
      price: String(item.price ?? 0),
      qty: item.qty || 0,
      amount: String(item.amount ?? 0),
    }));
    const { error: itemsError } = await client.from('purchase_order_items').insert(items);
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json(order);
}
