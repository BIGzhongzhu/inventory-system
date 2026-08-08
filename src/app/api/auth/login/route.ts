import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';
import { signSession, type SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    const client = getClient();
    const { data: user, error } = await client
      .from('users')
      .select('id, username, display_name, role, password_hash')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // Verify password using pg crypto
    const { data: result } = await client.rpc('verify_password', {
      input_password: password,
      stored_hash: user.password_hash,
    });

    if (!result) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 签发签名会话令牌（HMAC-SHA256，防伪造；私钥来自环境变量 SESSION_SECRET）
    const sessionData: SessionData = {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    const token = await signSession(sessionData);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
