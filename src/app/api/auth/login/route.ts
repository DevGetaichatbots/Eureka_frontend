import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', cleanEmail)
        .order('id', { ascending: false })
        .limit(1);

      const user = users?.[0];

      if (error || !user) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (user.status === 'disabled') {
        return NextResponse.json(
          { success: false, message: 'Account is disabled. Contact your administrator.' },
          { status: 403 }
        );
      }

      // Check password strictly using bcrypt
      const passwordMatch = user.password_hash
        ? bcrypt.compareSync(password, user.password_hash)
        : false;

      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Update last login timestamp in Supabase
      const nowIso = new Date().toISOString();
      await supabase
        .from('app_users')
        .update({ last_login_at: nowIso })
        .eq('id', user.id);

      const activeUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        last_login_at: nowIso,
      };

      const cookieStore = await cookies();
      cookieStore.set(
        'viewer_session',
        JSON.stringify({ id: activeUser.id, email: activeUser.email, role: activeUser.role }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        }
      );

      // Simple session token
      const sessionToken = Buffer.from(JSON.stringify(activeUser)).toString('base64');

      return NextResponse.json({
        success: true,
        user: activeUser,
        token: sessionToken,
        message: 'Authentication successful',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Authentication service unavailable' },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
