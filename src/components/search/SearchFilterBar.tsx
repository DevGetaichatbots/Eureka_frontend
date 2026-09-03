'use client';

import React from 'react';
import { Search, X, Calendar, RotateCcw, Filter } from 'lucide-react';

interface SearchFilterBarProps {
  query: string;
  fromDate: string;
  toDate: string;
  onQueryChange: (q: string) => void;
  onFromDateChange: (from: string) => void;
  onToDateChange: (to: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  onPresetSelect: (preset: 'all' | 'today' | '7days' | '30days') => void;
  activePreset: 'all' | 'today' | '7days' | '30days' | 'custom';
}

export function SearchFilterBar({
  query,
  fromDate,
  toDate,
  onQueryChange,
  onFromDateChange,
  onToDateChange,
  onSubmit,
  onReset,
  onPresetSelect,
  activePreset,
}: SearchFilterBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4"
    >
      {/* Row 1: Search Input & Submit */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by WhatsApp number (e.g. 92300...) or keyword across message transcripts..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228] transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#D92228]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-[#D92228] hover:bg-[#B71C21] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>

      {/* Row 2: Date Filters & Preset Buttons */}
      <div className="pt-3 border-t border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        {/* Date pickers */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-[#6B7280]">
            <Filter className="w-3.5 h-3.5 text-[#D92228]" />
            <span className="font-semibold">Date Filter:</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#D92228] focus:outline-none"
              />
            </div>
            <span className="text-[#6B7280]">to</span>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] focus:ring-1 focus:ring-[#D92228] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Preset Pills & Reset */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPresetSelect('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              activePreset === 'all'
                ? 'bg-[#D92228] text-white shadow-xs'
                : 'bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            All Time
          </button>

          <button
            type="button"
            onClick={() => onPresetSelect('today')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              activePreset === 'today'
                ? 'bg-[#D92228] text-white shadow-xs'
                : 'bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => onPresetSelect('7days')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              activePreset === '7days'
                ? 'bg-[#D92228] text-white shadow-xs'
                : 'bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            Last 7 Days
          </button>

          <button
            type="button"
            onClick={() => onPresetSelect('30days')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              activePreset === '30days'
                ? 'bg-[#D92228] text-white shadow-xs'
                : 'bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            Last 30 Days
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Reset Filters"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors ml-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
}
