import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';
import { verifySession } from '@/lib/session';

// 用户管理属于敏感操作（可创建/提权账号），仅管理员可访问
async function requireAdmin(request: NextRequest) {
  const session = await verifySession(request.cookies.get('auth_token')?.value);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
  }
  return null;
}

// GET - List all users (excluding password hashes)
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

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
  const denied = await requireAdmin(request);
  if (denied) return denied;

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
