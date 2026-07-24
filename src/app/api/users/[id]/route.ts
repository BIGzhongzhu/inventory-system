import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// PUT - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.displayName !== undefined) updateData.display_name = body.displayName;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.username !== undefined) updateData.username = body.username;

    // If password is being updated, hash it
    if (body.password) {
      const { data: hashResult, error: hashError } = await client.rpc('crypt_hash', { input_password: body.password });
      if (hashError || !hashResult) {
        return NextResponse.json({ error: '密码加密失败' }, { status: 500 });
      }
      updateData.password_hash = hashResult;
    }

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, display_name, role, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
  }
}

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getClient();

    const { error } = await client.from('users').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 });
  }
}
