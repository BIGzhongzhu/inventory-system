import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());

    if (sessionData.exp && sessionData.exp < Date.now()) {
      const response = NextResponse.json({ authenticated: false }, { status: 401 });
      response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.id,
        username: sessionData.username,
        displayName: sessionData.displayName,
        role: sessionData.role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
