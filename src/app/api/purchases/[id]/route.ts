import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// DELETE /api/purchases/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = getClient();
  const { id } = await params;
  const { error } = await client.from('purchase_orders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
