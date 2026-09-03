import { NextResponse } from 'next/server';
import { MOCK_USERS } from '@/lib/mockData';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    const body = await request.json();

    const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update fields
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

    const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      MOCK_USERS[userIndex].status = 'deleted' as any;
    }

    return NextResponse.json({ success: true, id: userId });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
