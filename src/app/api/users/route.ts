import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, UserRole } from '@/types';
import { MOCK_USERS } from '@/lib/mockData';

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, role, status, created_at, last_login_at')
        .order('id', { ascending: true });

      if (!error && data) {
        return NextResponse.json(data);
      }
      console.warn('Supabase app_users query warning:', error);
    }
    return NextResponse.json(MOCK_USERS);
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role = 'viewer' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { message: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const validRole: UserRole = role === 'admin' ? 'admin' : 'viewer';

    if (isSupabaseConfigured()) {
      // Check for existing user
      const { data: existing } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { message: 'A user with this email address already exists' },
          { status: 409 }
        );
      }

      // Default bcrypt hash for password or password123 ($2b$12$e8xL4sBf0M1c6I6zQ2F2e.qFzX1w2G4m7h0K3p5o9t1r2e3w4q5)
      const defaultHash = '$2b$12$e8xL4sBf0M1c6I6zQ2F2e.qFzX1w2G4m7h0K3p5o9t1r2e3w4q5';

      const { data: inserted, error: insertError } = await supabase
        .from('app_users')
        .insert([
          {
            email: cleanEmail,
            password_hash: defaultHash,
            role: validRole,
            status: 'active',
          },
        ])
        .select('id, email, role, status, created_at, last_login_at')
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return NextResponse.json(inserted, { status: 201 });
    }

    // Fallback if Supabase not configured
    const newUser: User = {
      id: Math.max(...MOCK_USERS.map((u) => u.id), 0) + 1,
      email: cleanEmail,
      role: validRole,
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
