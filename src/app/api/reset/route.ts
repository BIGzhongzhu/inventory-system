import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// POST /api/reset - clear all data and re-seed with init_qty = 0
export async function POST() {
  const client = getClient();
  try {
    // Delete all order items first (foreign key constraint)
    await client.from('sales_order_items').delete().neq('id', 0);
    await client.from('purchase_order_items').delete().neq('id', 0);

    // Delete all orders
    await client.from('sales_orders').delete().neq('id', 0);
    await client.from('purchase_orders').delete().neq('id', 0);

    // Delete customers and suppliers
    await client.from('customers').delete().neq('id', 0);
    await client.from('suppliers').delete().neq('id', 0);

    // Delete consumables
    await client.from('consumables').delete().neq('id', 0);

    // Delete all products
    await client.from('products').delete().neq('id', 0);

    // Now call seed internally
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.DEPLOY_RUN_PORT || 5000}`;

    const seedRes = await fetch(`${baseUrl}/api/seed`, { method: 'POST' });
    const seedData = await seedRes.json();

    return NextResponse.json({
      message: 'System reset and re-seeded successfully',
      ...seedData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
