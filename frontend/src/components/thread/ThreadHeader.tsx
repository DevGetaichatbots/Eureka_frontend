'use client';

import React from 'react';
import Link from 'next/link';
import { Conversation } from '@/types';
import { formatPhone, isWithin24Hours } from '@/lib/utils';
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  Flame,
  Archive,
} from 'lucide-react';

interface ThreadHeaderProps {
  conversation: Conversation;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ThreadHeader({
  conversation,
  onRefresh,
  isRefreshing = false,
}: ThreadHeaderProps) {
  const contactName = conversation.contact?.profile_name || 'WhatsApp Contact';
  const phone = formatPhone(conversation.contact?.wa_id);
  const activeWindow = isWithin24Hours(conversation.last_message_at);

  return (
    <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] flex items-center justify-between gap-3 bg-white shadow-xs">
      {/* Left: Back button & Contact Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/conversations"
          className="p-2 rounded-xl text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
          title="Back to Conversations"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="w-10 h-10 rounded-2xl bg-[#FDEBEC] text-[#D92228] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#F5C2C4] shadow-xs">
          {contactName[0]?.toUpperCase() || 'W'}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h2 className="text-sm font-bold text-[#1A1A1A] truncate">
              {contactName}
            </h2>
            <span className="text-xs font-mono text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
              {phone}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            <span className="font-mono text-[11px]">Thread #{conversation.id}</span>
            <span>·</span>
            {activeWindow ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                <Flame className="w-3 h-3 text-[#16A34A]" />
                Active 24h Window
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7280]">
                <Archive className="w-3 h-3" />
                Past 24h Window
              </span>
            )}
            <span>·</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
              <MessageSquare className="w-3 h-3 text-[#D92228]" />
              {conversation.message_count} messages
            </span>
          </div>
        </div>
      </div>

      {/* Right: Refresh & Read-Only Badge */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Thread"
          >
            <RefreshCw className={`w-4 h-4 text-[#D92228] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#6B7280]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D92228]" />
          <span className="font-medium">Read-Only Viewer</span>
        </div>
      </div>
    </div>
  );
}
