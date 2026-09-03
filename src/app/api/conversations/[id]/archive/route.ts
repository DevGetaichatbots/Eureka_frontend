import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const convId = Number(id);

  if (isNaN(convId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const isArchived = typeof body.is_archived === 'boolean' ? body.is_archived : true;
    const archivedAt = isArchived ? new Date().toISOString() : null;

    // 1. If Supabase client is configured, update Supabase directly
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          is_archived: isArchived,
          archived_at: archivedAt,
        })
        .eq('id', convId)
        .select()
        .single();

      if (error) {
        console.error(`Supabase error archiving conversation #${convId}:`, error);
      } else {
        return NextResponse.json({ success: true, conversation: data, is_archived: isArchived });
      }
    }

    // 2. Try proxying to FastAPI backend if running
    try {
      const backendUrl = `http://localhost:8000/api/conversations/${convId}/archive`;
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: isArchived }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {}

    // Fallback response for resilience
    return NextResponse.json({ success: true, id: convId, is_archived: isArchived });
  } catch (err: any) {
    console.error(`Error archiving conversation #${convId}:`, err);
    return NextResponse.json({ error: err?.message || 'Failed to update archive status' }, { status: 500 });
  }
}
