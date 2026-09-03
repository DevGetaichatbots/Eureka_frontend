import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_USERS } from '@/lib/mockData';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    const body = await request.json();

    const updateFields: Record<string, any> = {};
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.role !== undefined) updateFields.role = body.role;

    if (isSupabaseConfigured()) {
      const { data: updated, error } = await supabase
        .from('app_users')
        .update(updateFields)
        .eq('id', userId)
        .select('id, email, role, status, created_at, last_login_at')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json(updated);
    }

    const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (body.status !== undefined) {
      MOCK_USERS[userIndex].status = body.status;
    }
    if (body.role !== undefined) {
      MOCK_USERS[userIndex].role = body.role;
    }

    return NextResponse.json(MOCK_USERS[userIndex]);
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  return PATCH(request, props);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (userId === 1) {
      return NextResponse.json(
        { message: 'Cannot delete the primary root admin account' },
        { status: 403 }
      );
    }

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({ success: true, message: 'User deleted from Supabase' });
    }

    const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    MOCK_USERS.splice(userIndex, 1);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
