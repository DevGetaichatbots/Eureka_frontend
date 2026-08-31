'use client';

import React from 'react';
import { Users, Flame, MessageSquare, TrendingUp } from 'lucide-react';

interface LeadsSummaryCardsProps {
  totalLeads: number;
  activeLeads: number;
  totalMessages: number;
}

export function LeadsSummaryCards({
  totalLeads,
  activeLeads,
  totalMessages,
}: LeadsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Unique Leads */}
      <div className="bg-white dark:bg-[#162026] p-5 rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
            Total Unique Leads
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-[#1A1A1A] dark:text-[#F3F4F6]">
              {totalLeads}
            </span>
            <span className="text-[11px] text-[#16A34A] font-semibold">
              Verified Contacts
            </span>
          </div>
        </div>
      </div>

      {/* Active Today / 24h Window */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Active in 24h Window
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-[#1A1A1A]">
              {activeLeads}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Hot Leads
            </span>
          </div>
        </div>
      </div>

      {/* Total Messages Processed */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Total Messages Processed
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-[#1A1A1A]">
              {totalMessages}
            </span>
            <span className="text-[11px] text-[#6B7280] font-medium">
              Inbound & Bot Outbound
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
