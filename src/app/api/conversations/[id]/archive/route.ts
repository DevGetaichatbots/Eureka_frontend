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
    const chatUserName = body.chat_user_name || body.contact_name || null;
    const waId = body.wa_id || null;
    const archivedByUser = body.archived_by_user || 'admin@eurekajo.com';
    const lastMessage = body.last_message || null;
    const messageCount = Number(body.message_count) || 0;
    const contactId = body.contact_id ? Number(body.contact_id) : null;
    const archivedAt = new Date().toISOString();

    // 1. Direct Supabase operation
    if (isSupabaseConfigured()) {
      if (isArchived) {
        // Upsert into archived_chats table
        await supabase
          .from('archived_chats')
          .upsert(
            {
              conversation_id: convId,
              contact_id: contactId,
              chat_user_name: chatUserName,
              wa_id: waId,
              archived_by_user: archivedByUser,
              last_message: lastMessage,
              message_count: messageCount,
              archived_at: archivedAt,
            },
            { onConflict: 'conversation_id' }
          );
      } else {
        // Delete from archived_chats table when unarchived
        await supabase
          .from('archived_chats')
          .delete()
          .eq('conversation_id', convId);
      }
    }

    // 2. Proxy to FastAPI backend
    try {
      const backendUrl = `http://localhost:8000/api/conversations/${convId}/archive`;
      await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_archived: isArchived,
          chat_user_name: chatUserName,
          wa_id: waId,
          archived_by_user: archivedByUser,
          last_message: lastMessage,
          message_count: messageCount,
          contact_id: contactId,
        }),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      conversation_id: convId,
      chat_user_name: chatUserName,
      is_archived: isArchived,
    });
  } catch (err: any) {
    console.error(`Error managing archived_chats for #${convId}:`, err);
    return NextResponse.json({ success: true, id: convId, is_archived: true });
  }
}
