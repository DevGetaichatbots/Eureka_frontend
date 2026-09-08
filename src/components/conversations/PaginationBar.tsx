'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (newLimit: number) => void;
  itemName?: string;
}

export function PaginationBar({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  itemName = 'conversations',
}: PaginationBarProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div className="py-3.5 px-4 sm:px-6 border-t border-[#E5E7EB] dark:border-[#26353d] bg-white dark:bg-[#162026] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
      {/* Left: Range and Page Size Selector */}
      <div className="flex items-center gap-3">
        <div>
          {totalItems === 0 ? (
            <span>No {itemName} to display</span>
          ) : (
            <span>
              Showing <strong className="text-[#1A1A1A] dark:text-[#F3F4F6]">{start}</strong>–
              <strong className="text-[#1A1A1A] dark:text-[#F3F4F6]">{end}</strong> of{' '}
              <strong className="text-[#1A1A1A] dark:text-[#F3F4F6]">{totalItems}</strong> {itemName}
            </span>
          )}
        </div>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-[#E5E7EB] dark:border-[#26353d]">
            <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="py-1 px-2 rounded-lg border border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33] text-xs text-[#1A1A1A] dark:text-[#F3F4F6] focus:outline-none focus:ring-1 focus:ring-[#D92228] cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#26353d] bg-white dark:bg-[#202c33] text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9FAFB] dark:hover:bg-[#26353d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="px-2.5 py-1 text-xs font-semibold text-[#1A1A1A] dark:text-[#F3F4F6]">
            Page {page} of {totalPages}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#26353d] bg-white dark:bg-[#202c33] text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9FAFB] dark:hover:bg-[#26353d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs font-medium"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
