import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const session = await verifySession(token);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      username: session.username,
      displayName: session.displayName,
      role: session.role,
    },
  });
}
