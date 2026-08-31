'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export function PaginationBar({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  itemName = 'conversations',
}: PaginationBarProps) {
  if (totalPages <= 1 && totalItems <= limit) {
    return (
      <div className="py-4 px-6 border-t border-gray-100 dark:border-[#222e35] flex items-center justify-between text-xs text-[#8696a0]">
        <span>Showing all {totalItems} {itemName} (50 per page)</span>
        <span>Page 1 of 1</span>
      </div>
    );
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div className="py-4 px-6 border-t border-gray-100 dark:border-[#222e35] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8696a0]">
      <div>
        Showing <span className="font-semibold text-[#111b21] dark:text-[#e9edef]">{start}</span> -{' '}
        <span className="font-semibold text-[#111b21] dark:text-[#e9edef]">{end}</span> of{' '}
        <span className="font-semibold text-[#111b21] dark:text-[#e9edef]">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#222e35] bg-white dark:bg-[#111b21] text-[#111b21] dark:text-[#e9edef] hover:bg-gray-50 dark:hover:bg-[#202c33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="px-3 py-1 font-semibold text-[#111b21] dark:text-[#e9edef]">
          {page} / {totalPages}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#222e35] bg-white dark:bg-[#111b21] text-[#111b21] dark:text-[#e9edef] hover:bg-gray-50 dark:hover:bg-[#202c33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
