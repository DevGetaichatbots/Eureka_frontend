'use client';

import React from 'react';
import Link from 'next/link';
import { SearchResultItem as SearchResultType } from '@/types';
import { formatKarachiDateTime, formatPhone, isWithin24Hours } from '@/lib/utils';
import {
  MessageSquare,
  Bot,
  User,
  ChevronRight,
  Clock,
  Flame,
  Search,
} from 'lucide-react';

interface SearchResultItemProps {
  result: SearchResultType;
  searchQuery: string;
}

function HighlightText({ text, query }: { text: string | null | undefined; query: string }) {
  if (!text) return null;
  if (!query || query.trim() === '') return <span>{text}</span>;

  const cleanQuery = query.trim();
  const regex = new RegExp(`(${cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[#FDEBEC] dark:bg-[#2D1416] text-[#D92228] dark:text-[#F5C2C4] font-bold px-1 rounded-sm border border-[#F5C2C4] dark:border-[#521C20]"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function SearchResultItem({ result, searchQuery }: SearchResultItemProps) {
  const contactName = result.contact?.profile_name || 'WhatsApp Contact';
  const phone = formatPhone(result.contact?.wa_id);
  const activeWindow = isWithin24Hours(result.last_message_at);
  const matchingMsgs = result.matching_messages || [];

  return (
    <Link
      href={`/conversations/${result.id}`}
      className="group block p-4 sm:p-5 bg-white hover:bg-[#F9FAFB] border-b border-[#E5E7EB] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Contact Info & Snippets */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-2xl bg-[#FDEBEC] text-[#D92228] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#F5C2C4] mt-0.5 shadow-xs">
            {contactName[0]?.toUpperCase() || 'W'}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            {/* Header info */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#D92228] transition-colors truncate">
                <HighlightText text={contactName} query={searchQuery} />
              </h3>

              <span className="text-xs font-mono text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
                <HighlightText text={phone} query={searchQuery} />
              </span>

              {activeWindow ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-[#16A34A]" />
                  Active
                </span>
              ) : (
                <span className="text-[10px] text-[#6B7280] bg-[#F9FAFB] px-2 py-0.5 rounded-full">
                  Past 24h
                </span>
              )}
            </div>

            {/* Matching message snippets */}
            <div className="space-y-1.5 pt-1">
              {matchingMsgs.map((msg) => {
                const isBot = msg.direction === 'bot';
                return (
                  <div
                    key={msg.id}
                    className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px]">
                        {isBot ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-[#D92228]" />
                            <span className="text-[#D92228]">Eureka Jo Bot</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span className="text-[#6B7280]">{contactName}</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-[#6B7280]">
                        {formatKarachiDateTime(msg.sent_at)}
                      </span>
                    </div>
                    <p className="text-[#1A1A1A] text-xs leading-relaxed">
                      <HighlightText text={msg.body} query={searchQuery} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right action */}
        <div className="flex items-center gap-3 flex-shrink-0 text-right">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-[#6B7280] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#D92228]" />
              {formatKarachiDateTime(result.last_message_at)}
            </span>
            <span className="mt-1 text-[11px] text-[#6B7280]">
              {result.message_count} total messages
            </span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-[#F9FAFB] group-hover:bg-[#D92228] group-hover:text-white text-[#6B7280] flex items-center justify-center transition-all">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
