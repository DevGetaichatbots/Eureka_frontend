import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const body = await request.json();
    const { current_password, new_password } = body;

    if (!new_password || new_password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (new_password === current_password) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      // Decode user from token or use email if in payload
      let userEmail: string | null = null;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
          userEmail = decoded.email || null;
        } catch {
          // Token might be JWT from FastAPI
        }
      }

      if (!userEmail) {
        return NextResponse.json(
          { success: false, message: 'Not authenticated' },
          { status: 401 }
        );
      }

      const { data: user } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (user && user.password_hash) {
        const match = bcrypt.compareSync(current_password, user.password_hash);
        if (!match) {
          return NextResponse.json(
            { success: false, message: 'Current password is incorrect' },
            { status: 400 }
          );
        }

        const newHash = bcrypt.hashSync(new_password, 10);
        await supabase
          .from('app_users')
          .update({ password_hash: newHash })
          .eq('id', user.id);

        return NextResponse.json({
          success: true,
          message: 'Password updated successfully!',
        });
      }
    }

    return NextResponse.json(
      { success: false, message: 'Password was not saved to the database' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
