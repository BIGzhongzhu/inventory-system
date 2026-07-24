import { getClient } from '@/app/api/_db';
import { NextResponse } from 'next/server';

// GET /api/products/[id] - get single product
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = getClient();
  const { id } = await params;
  const { data, error } = await client.from('products').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT /api/products/[id] - update product
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = getClient();
  const { id } = await params;
  const body = await request.json();
  const updateData: Record<string, unknown> = {
    name: body.name,
    spec: body.spec || null,
    unit: body.unit,
    price: String(body.price ?? 0),
    sale_price: String(body.sale_price ?? 0),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/products/[id] - delete product
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = getClient();
  const { id } = await params;
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
