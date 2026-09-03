import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MOCK_USERS } from '@/lib/mockData';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check mock credentials or accept admin@company.com with password123
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (user && user.status === 'disabled') {
      return NextResponse.json(
        { success: false, message: 'Your account is disabled. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Allow login for mock user or fallback mock admin
    if ((user && password === 'password123') || (email === 'admin@company.com' && password === 'password123')) {
      const activeUser = user || {
        id: 1,
        email: 'admin@company.com',
        role: 'admin' as const,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };

      const cookieStore = await cookies();
      cookieStore.set('viewer_session', JSON.stringify({ id: activeUser.id, email: activeUser.email, role: activeUser.role }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: activeUser,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid email or password. Use password123' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
