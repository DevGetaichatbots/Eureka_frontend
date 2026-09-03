import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_CONTACTS } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

    if (isSupabaseConfigured()) {
      // Query live contacts from Supabase
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_seen_at', { ascending: false });

      if (!error && contacts) {
        let filtered = contacts;
        if (q) {
          const digits = q.replace(/\D/g, '');
          filtered = filtered.filter((c) => {
            const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
            const phoneMatch = digits.length >= 3 && String(c.wa_id).includes(digits);
            return nameMatch || phoneMatch;
          });
        }

        const total = filtered.length;
        const total_pages = Math.ceil(total / limit) || 1;
        const startIndex = (page - 1) * limit;
        const items = filtered.slice(startIndex, startIndex + limit);

        return NextResponse.json({
          items,
          total,
          page,
          limit,
          total_pages,
        });
      }
    }

    let filtered = MOCK_CONTACTS;
    if (q) {
      const digits = q.replace(/\D/g, '');
      filtered = filtered.filter((c) => {
        const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
        const phoneMatch = digits.length >= 3 && c.wa_id.includes(digits);
        return nameMatch || phoneMatch;
      });
    }

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      total_pages,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
