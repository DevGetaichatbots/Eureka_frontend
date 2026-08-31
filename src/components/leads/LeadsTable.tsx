'use client';

import React from 'react';
import Link from 'next/link';
import { Contact } from '@/types';
import { formatKarachiDateTime, formatPhone, isWithin24Hours } from '@/lib/utils';
import {
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Flame,
  Clock,
  Calendar,
} from 'lucide-react';

interface LeadsTableProps {
  contacts: Contact[];
  loading: boolean;
  searchQuery: string;
}

export function LeadsTable({ contacts, loading, searchQuery }: LeadsTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-[#222e35]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-[#202c33]" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-[#202c33] rounded w-1/2" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-28 hidden md:block" />
            <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202c33] text-[#8696a0] flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#111b21] dark:text-[#e9edef]">
          No unique leads found
        </h3>
        <p className="text-xs text-[#8696a0] mt-1 max-w-xs mx-auto">
          {searchQuery
            ? `No contacts match "${searchQuery}". Try a different name or phone number.`
            : 'No customer contacts have been recorded yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33]/40 text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
            <th className="py-3.5 px-4 sm:px-6">Contact & Phone</th>
            <th className="py-3.5 px-4 hidden md:table-cell">First Contact</th>
            <th className="py-3.5 px-4">Last Activity</th>
            <th className="py-3.5 px-4 text-center">Messages</th>
            <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#26353d] text-xs">
          {contacts.map((contact) => {
            const active = isWithin24Hours(contact.last_seen_at);
            const name = contact.profile_name || 'WhatsApp User';
            const phone = formatPhone(contact.wa_id);

            return (
              <tr
                key={contact.id}
                className="hover:bg-[#F9FAFB] dark:hover:bg-[#202c33]/40 transition-colors group"
              >
                {/* Contact & Phone */}
                <td className="py-4 px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FDEBEC] text-[#D92228] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#F5C2C4]">
                      {name[0]?.toUpperCase() || 'W'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1A1A1A] dark:text-[#F3F4F6] group-hover:text-[#D92228] transition-colors">
                        {name}
                      </p>
                      <p className="font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                        {phone}
                      </p>
                    </div>
                  </div>
                </td>

                {/* First Contact Date */}
                <td className="py-4 px-4 hidden md:table-cell text-[#6B7280] dark:text-[#9CA3AF]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D92228]" />
                    <span>{formatKarachiDateTime(contact.first_seen_at)}</span>
                  </div>
                </td>

                {/* Last Activity Date */}
                <td className="py-4 px-4 text-[#1A1A1A]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Clock className="w-3.5 h-3.5 text-[#D92228]" />
                      <span>{formatKarachiDateTime(contact.last_seen_at)}</span>
                    </div>
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 text-[#16A34A]" />
                        Active Window
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                        Past 24h
                      </span>
                    )}
                  </div>
                </td>

                {/* Total Messages Count */}
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F9FAFB] border border-[#E5E7EB] text-[#1A1A1A]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#D92228]" />
                    {contact.message_count}
                  </span>
                </td>

                {/* Action Link */}
                <td className="py-4 px-4 sm:px-6 text-right">
                  <Link
                    href={`/conversations/${contact.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#D92228] hover:text-white hover:border-[#D92228] transition-all shadow-xs cursor-pointer"
                  >
                    <span>View Chat</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
