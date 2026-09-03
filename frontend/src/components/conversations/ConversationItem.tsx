'use client';

import React from 'react';
import Link from 'next/link';
import { Conversation } from '@/types';
import { formatKarachiDateTime, formatPhone, isWithin24Hours } from '@/lib/utils';
import {
  MessageSquare,
  Bot,
  User,
  Image as ImageIcon,
  ChevronRight,
  Clock,
  CheckCheck,
} from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const contactName = conversation.contact?.profile_name || 'WhatsApp User';
  const phone = formatPhone(conversation.contact?.wa_id);
  const lastMsg = conversation.last_message;
  const isBot = lastMsg?.direction === 'bot';
  const isImage = lastMsg?.msg_type === 'image';
  const activeWindow = isWithin24Hours(conversation.last_message_at);

  return (
    <Link
      href={`/conversations/${conversation.id}`}
      className="group block p-4 sm:p-5 bg-white hover:bg-[#F9FAFB] border-b border-[#E5E7EB] transition-all duration-150"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Avatar & Message Details */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-[#FDEBEC] text-[#D92228] font-bold text-base flex items-center justify-center border border-[#F5C2C4] shadow-xs">
              {contactName[0]?.toUpperCase() || 'W'}
            </div>
            {activeWindow && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#16A34A] border-2 border-white"
                title="Active 24-hour window"
              />
            )}
          </div>

          {/* Texts */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#D92228] transition-colors truncate">
                {contactName}
              </h3>
              <span className="text-xs font-mono text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
                {phone}
              </span>
              {activeWindow ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  Active Window
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#6B7280] bg-[#F9FAFB] px-2 py-0.5 rounded-full">
                  Past 24h
                </span>
              )}
            </div>

            {/* Last message snippet */}
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1 truncate">
              {isBot ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#D92228] flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                  Eureka Jo Bot:
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-[#6B7280] flex-shrink-0">
                  <User className="w-3.5 h-3.5" />
                  Customer:
                </span>
              )}

              {isImage ? (
                <span className="inline-flex items-center gap-1 italic text-indigo-600">
                  <ImageIcon className="w-3.5 h-3.5" />
                  [Photo attachment]
                </span>
              ) : (
                <span className="truncate">
                  {lastMsg?.body || 'No messages in thread'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Timestamp, Count & Action */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-[#6B7280] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#D92228]" />
              {formatKarachiDateTime(conversation.last_message_at)}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F9FAFB] text-[#6B7280]">
                <MessageSquare className="w-3 h-3" />
                {conversation.message_count} {conversation.message_count === 1 ? 'msg' : 'msgs'}
              </span>
              {lastMsg?.meta_status === 'read' && (
                <span title="Read">
                  <CheckCheck className="w-4 h-4 text-[#16A34A]" />
                </span>
              )}
            </div>
          </div>

          <div className="w-8 h-8 rounded-xl bg-[#F9FAFB] group-hover:bg-[#D92228] group-hover:text-white text-[#6B7280] flex items-center justify-center transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
