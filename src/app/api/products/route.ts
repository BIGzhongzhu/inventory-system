import { getClient } from '@/app/api/_db';
import { NextResponse } from 'next/server';

// GET /api/products - list all products
export async function GET() {
  const client = getClient();
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('id', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/products - create product
export async function POST(request: Request) {
  const client = getClient();
  const body = await request.json();
  const { data, error } = await client
    .from('products')
    .insert({
      code: body.code,
      name: body.name,
      spec: body.spec || null,
      unit: body.unit,
      price: String(body.price || 0),
      sale_price: String(body.sale_price || 0),
      init_qty: body.init_qty || 0,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
