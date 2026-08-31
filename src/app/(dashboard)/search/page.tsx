'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchResultItem as SearchResultType } from '@/types';
import { api } from '@/lib/api';
import { SearchFilterBar } from '@/components/search/SearchFilterBar';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { PaginationBar } from '@/components/conversations/PaginationBar';
import {
  Search,
  MessageSquare,
  Sparkles,
  RotateCcw,
  Loader2,
  Calendar,
} from 'lucide-react';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [fromDate, setFromDate] = useState(searchParams.get('from') || '');
  const [toDate, setToDate] = useState(searchParams.get('to') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [results, setResults] = useState<SearchResultType[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [activePreset, setActivePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');

  const executeSearch = async (qVal: string, fromVal: string, toVal: string, pageVal: number) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.search(qVal, fromVal, toVal, pageVal);
      setResults(res.items);
      setTotalItems(res.total);
      setTotalPages(res.total_pages);
      setPage(res.page);

      // Sync URL
      const params = new URLSearchParams();
      if (qVal) params.set('q', qVal);
      if (fromVal) params.set('from', fromVal);
      if (toVal) params.set('to', toVal);
      if (pageVal > 1) params.set('page', String(pageVal));

      const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
      router.replace(newUrl);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial run if URL params exist or on mount
    const qParam = searchParams.get('q') || '';
    const fromParam = searchParams.get('from') || '';
    const toParam = searchParams.get('to') || '';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    setQuery(qParam);
    setFromDate(fromParam);
    setToDate(toParam);
    setPage(pageParam);

    executeSearch(qParam, fromParam, toParam, pageParam);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, fromDate, toDate, 1);
  };

  const handleReset = () => {
    setQuery('');
    setFromDate('');
    setToDate('');
    setActivePreset('all');
    executeSearch('', '', '', 1);
  };

  const handlePresetSelect = (preset: 'all' | 'today' | '7days' | '30days') => {
    setActivePreset(preset);
    const today = new Date().toISOString().split('T')[0];

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
      executeSearch(query, '', '', 1);
    } else if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
      executeSearch(query, today, today, 1);
    } else if (preset === '7days') {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFromDate(past7);
      setToDate(today);
      executeSearch(query, past7, today, 1);
    } else if (preset === '30days') {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFromDate(past30);
      setToDate(today);
      executeSearch(query, past30, today, 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6] leading-none">
              Search & Date Filters
            </h1>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
              Query Eureka Jo customer transcripts by phone number or keyword with date boundaries
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <SearchFilterBar
        query={query}
        fromDate={fromDate}
        toDate={toDate}
        onQueryChange={setQuery}
        onFromDateChange={(val) => {
          setFromDate(val);
          setActivePreset('custom');
        }}
        onToDateChange={(val) => {
          setToDate(val);
          setActivePreset('custom');
        }}
        onSubmit={handleFormSubmit}
        onReset={handleReset}
        onPresetSelect={handlePresetSelect}
        activePreset={activePreset}
      />

      {/* Results Header / Suggestions */}
      <div className="flex items-center justify-between px-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
        <div>
          {hasSearched && (
            <span>
              Found <strong className="text-[#1A1A1A] dark:text-[#F3F4F6]">{totalItems}</strong> matching conversation{totalItems === 1 ? '' : 's'}
              {query && (
                <> for &ldquo;<span className="text-[#D92228] font-bold">{query}</span>&rdquo;</>
              )}
              {(fromDate || toDate) && (
                <> in date range ({fromDate || 'earliest'} to {toDate || 'now'})</>
              )}
            </span>
          )}
        </div>

        {/* Quick query chips */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[11px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#D92228]" /> Try:
          </span>
          {['Amman', 'Apartment', 'Villa', 'Price', 'Listing'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag);
                executeSearch(tag, fromDate, toDate, 1);
              }}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] hover:border-[#D92228] hover:text-[#D92228] text-[11px] text-[#6B7280] dark:text-[#9CA3AF] transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container Card */}
      <div className="bg-white dark:bg-[#162026] rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs overflow-hidden">
        {/* Loading Skeletons */}
        {loading ? (
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#26353d]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 flex items-start gap-4 animate-pulse">
                <div className="w-11 h-11 rounded-2xl bg-[#F3F4F6] dark:bg-[#202c33]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#F3F4F6] dark:bg-[#202c33] rounded w-1/4" />
                  <div className="h-8 bg-[#F3F4F6] dark:bg-[#202c33] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F9FAFB] dark:bg-[#202c33] text-[#9CA3AF] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">
              No matching conversations found
            </h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 max-w-sm mx-auto">
              No conversations or message bodies match your query. Try broadening your keywords or adjusting date boundaries.
            </p>
            <button
              onClick={handleReset}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#D92228] text-white hover:bg-[#B71C21] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Search Filters</span>
            </button>
          </div>
        ) : (
          /* Results List */
          <div className="divide-y divide-[#E5E7EB] dark:divide-[#26353d]">
            {results.map((result) => (
              <SearchResultItem
                key={result.id}
                result={result}
                searchQuery={query}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={50}
          onPageChange={(newPage) => executeSearch(query, fromDate, toDate, newPage)}
        />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center text-[#6B7280] dark:text-[#9CA3AF] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D92228]" />
          <p className="text-xs font-medium">Loading search engine...</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
