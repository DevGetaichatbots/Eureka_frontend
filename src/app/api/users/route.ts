import { NextResponse } from 'next/server';
import { MOCK_USERS } from '@/lib/mockData';
import { User, UserRole } from '@/types';

export async function GET() {
  return NextResponse.json(MOCK_USERS.filter((u) => (u.status as string) !== 'deleted'));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role = 'viewer' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const existing = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        { message: 'A user with this email address already exists' },
        { status: 409 }
      );
    }

    const newUser: User = {
      id: Math.max(...MOCK_USERS.map((u) => u.id), 0) + 1,
      email: email.trim().toLowerCase(),
      role: (role === 'admin' ? 'admin' : 'viewer') as UserRole,
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: null,
    };

    MOCK_USERS.unshift(newUser);

    return NextResponse.json(newUser, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
