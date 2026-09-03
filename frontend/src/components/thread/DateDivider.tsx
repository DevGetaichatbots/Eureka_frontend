'use client';

import React from 'react';
import { formatDateDivider } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface DateDividerProps {
  dateStr: string;
}

export function DateDivider({ dateStr }: DateDividerProps) {
  const label = formatDateDivider(dateStr);

  return (
    <div className="flex items-center justify-center my-4">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide bg-white/90 dark:bg-[#182229] text-[#6B7280] dark:text-[#9CA3AF] border border-[#E5E7EB] dark:border-[#26353d] shadow-xs">
        <Calendar className="w-3 h-3 text-[#D92228]" />
        <span>{label}</span>
      </div>
    </div>
  );
}
