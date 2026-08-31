import { NextResponse } from 'next/server';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/lib/mockData';
import { Conversation, Message } from '@/types';

export interface SearchResultItem extends Conversation {
  matching_messages: Message[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

  const results: SearchResultItem[] = [];

  for (const conv of MOCK_CONVERSATIONS) {
    const messages = MOCK_MESSAGES[conv.id] || [];
    const lowerQuery = q.toLowerCase();

    // Check contact level match
    const digitsOnly = q.replace(/\D/g, '');
    const matchesPhone = digitsOnly.length >= 3 && (conv.contact?.wa_id.includes(digitsOnly) ?? false);
    const matchesName = Boolean(lowerQuery && conv.contact?.profile_name?.toLowerCase().includes(lowerQuery));

    // Check message body match (simulating PostgreSQL GIN full-text index)
    const matchingMessages = messages.filter((m) => {
      return lowerQuery ? m.body?.toLowerCase().includes(lowerQuery) : false;
    });

    const hasMatch = !q ? true : (matchesPhone || matchesName || matchingMessages.length > 0);

    // Check date filters
    let matchesDate = true;
    if (fromDate) {
      const fromTime = new Date(fromDate).getTime();
      const lastMsgTime = new Date(conv.last_message_at).getTime();
      if (lastMsgTime < fromTime) matchesDate = false;
    }
    if (toDate) {
      const toTime = new Date(toDate).getTime() + 24 * 60 * 60 * 1000; // inclusive end of day
      const startedTime = new Date(conv.started_at).getTime();
      if (startedTime > toTime) matchesDate = false;
    }

    if (hasMatch && matchesDate) {
      results.push({
        ...conv,
        matching_messages: matchingMessages.length > 0 ? matchingMessages : messages.slice(-1),
      });
    }
  }

  const total = results.length;
  const total_pages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = results.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    total_pages,
  });
}
