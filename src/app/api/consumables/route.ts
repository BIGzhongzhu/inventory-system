import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// GET /api/consumables
export async function GET() {
  const client = getClient();
  const { data, error } = await client
    .from('consumables')
    .select('*')
    .order('id', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/consumables
export async function POST(request: Request) {
  const client = getClient();
  const body = await request.json();
  const { data, error } = await client
    .from('consumables')
    .insert({
      year: body.year,
      month: body.month,
      date: body.date || null,
      dept: body.dept || null,
      item: body.item || null,
      model: body.model || null,
      price: String(body.price || 0),
      qty: body.qty || 0,
      total: String(body.total || 0),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/consumables
export async function DELETE(request: Request) {
  const client = getClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const { error } = await client.from('consumables').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
