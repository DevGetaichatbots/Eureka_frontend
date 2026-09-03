import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const backendUrl = `http://localhost:8000/api/conversations/${id}`;
    const res = await fetch(backendUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error(`Error proxying conversation ${id} to FastAPI:`, err);
  }
  return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const convId = Number(id);

  try {
    const body = await request.json().catch(() => ({}));
    const contactId = body.contact_id ? Number(body.contact_id) : null;
    const waId = body.wa_id || null;
    const deletedByUser = body.deleted_by_user || 'admin@eurekajo.com';

    if (isSupabaseConfigured()) {
      await supabase
        .from('deleted_chats')
        .upsert(
          {
            conversation_id: convId,
            contact_id: contactId,
            wa_id: waId,
            deleted_by_user: deletedByUser,
            deleted_at: new Date().toISOString(),
          },
          { onConflict: 'conversation_id' }
        );
    }

    try {
      const backendUrl = `http://localhost:8000/api/conversations/${convId}`;
      await fetch(backendUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, wa_id: waId, deleted_by_user: deletedByUser }),
      });
    } catch {}

    return NextResponse.json({ success: true, id: convId });
  } catch (err: any) {
    console.error(`Error recording deleted chat #${convId}:`, err);
    return NextResponse.json({ success: true, id: convId });
  }
}
