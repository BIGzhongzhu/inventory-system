import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

export async function GET() {
  try {
    const client = getClient();

    // Check if users table exists and has at least one row
    const { data, error } = await client
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      // Table doesn't exist or other DB error → not initialized
      return NextResponse.json({ initialized: false, reason: 'database_error', detail: error.message });
    }

    if (!data || data.length === 0) {
      // Table exists but no users → not initialized
      return NextResponse.json({ initialized: false, reason: 'no_users' });
    }

    return NextResponse.json({ initialized: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ initialized: false, reason: 'connection_error', detail: message });
  }
}
