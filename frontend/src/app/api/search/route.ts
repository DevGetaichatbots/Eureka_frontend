import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://eureka-backend-ylbd.onrender.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

  try {
    // Build backend query: use /api/conversations with search param
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('window', 'all');

    const backendRes = await fetch(`${BACKEND_URL}/api/conversations?${params.toString()}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!backendRes.ok) {
      throw new Error(`Backend returned ${backendRes.status}`);
    }

    const data = await backendRes.json();
    const conversations = data.items || [];

    // Apply date filters client-side (backend doesn't support date range on conversations yet)
    const filtered = conversations.filter((conv: { last_message_at: string; started_at: string }) => {
      if (fromDate) {
        const fromTime = new Date(fromDate).getTime();
        const lastMsgTime = new Date(conv.last_message_at).getTime();
        if (lastMsgTime < fromTime) return false;
      }
      if (toDate) {
        const toTime = new Date(toDate).getTime() + 24 * 60 * 60 * 1000;
        const startedTime = new Date(conv.started_at).getTime();
        if (startedTime > toTime) return false;
      }
      return true;
    });

    // Attach matching_messages field (use last_message as the snippet)
    const items = filtered.map((conv: Record<string, unknown>) => ({
      ...conv,
      matching_messages: conv.last_message ? [conv.last_message] : [],
    }));

    const total = items.length;
    const total_pages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      total_pages,
    });
  } catch (err) {
    console.error('Search proxy error:', err);
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 50, total_pages: 1 });
  }
}
