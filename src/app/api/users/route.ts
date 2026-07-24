import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// GET - List all users (excluding password hashes)
export async function GET() {
  const client = getClient();
  const { data, error } = await client
    .from('users')
    .select('id, username, display_name, role, created_at, updated_at')
    .order('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const { username, password, displayName, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const client = getClient();

    // Hash the password using pgcrypto
    const { data: hashResult, error: hashError } = await client.rpc('crypt_hash', { input_password: password });

    if (hashError || !hashResult) {
      return NextResponse.json({ error: '密码加密失败' }, { status: 500 });
    }

    const { data, error } = await client
      .from('users')
      .insert({
        username,
        password_hash: hashResult,
        display_name: displayName || username,
        role: role || 'user',
      })
      .select('id, username, display_name, role, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
  }
}
