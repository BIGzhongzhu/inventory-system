import { getClient } from '@/app/api/_db';
import { NextResponse } from 'next/server';

// GET /api/customers
export async function GET() {
  const client = getClient();
  const { data, error } = await client.from('customers').select('*').order('id', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/customers
export async function POST(request: Request) {
  const client = getClient();
  const body = await request.json();
  const { data, error } = await client
    .from('customers')
    .insert({
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      contact: body.contact || null,
      bank: body.bank || null,
      account: body.account || null,
      remark: body.remark || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
