import { NextResponse } from 'next/server';
import { MOCK_CONTACTS } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

  let filtered = MOCK_CONTACTS;

  if (q) {
    const digits = q.replace(/\D/g, '');
    filtered = filtered.filter((c) => {
      const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
      const phoneMatch = digits.length >= 3 && c.wa_id.includes(digits);
      return nameMatch || phoneMatch;
    });
  }

  // Sort newest contact last_seen_at first
  filtered = [...filtered].sort(
    (a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()
  );

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
