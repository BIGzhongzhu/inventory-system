import { NextResponse } from 'next/server';
import { getClient } from '../../../_db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getClient();

  try {
    let verifiedValue = true;
    try {
      const body = await request.json();
      if (typeof body.verified === 'boolean') {
        verifiedValue = body.verified;
      }
    } catch {
      // No body, default to true
    }

    const { data, error } = await client
      .from('sales_orders')
      .update({ verified: verifiedValue })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '订单未找到' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
