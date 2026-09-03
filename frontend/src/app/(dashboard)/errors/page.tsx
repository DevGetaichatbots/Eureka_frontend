'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ErrorLog } from '@/types';
import { api } from '@/lib/api';
import { ErrorSummaryCards } from '@/components/errors/ErrorSummaryCards';
import { ErrorTable } from '@/components/errors/ErrorTable';
import { ErrorPayloadModal } from '@/components/errors/ErrorPayloadModal';
import {
  AlertTriangle,
  Search,
  RefreshCw,
  X,
  Filter,
  ShieldAlert,
} from 'lucide-react';

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const res = await api.getErrors(50);
      const safeList = Array.isArray(res) ? res : (res as any)?.items || (res as any)?.errors || [];
      setErrors(safeList);
    } catch (err) {
      console.error('Failed to load error logs:', err);
      setErrors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadErrors();
  };

  // Local filtering by step and search
  const filteredErrors = useMemo(() => {
    const safeList = errors || [];
    return safeList.filter((err) => {
      const matchesStep = stepFilter === 'all' || err.step.toLowerCase() === stepFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        err.error_text.toLowerCase().includes(q) ||
        (err.wa_id && err.wa_id.includes(q)) ||
        (err.inbound_body && err.inbound_body.toLowerCase().includes(q));

      return matchesStep && matchesSearch;
    });
  }, [errors, stepFilter, searchQuery]);

  const stepCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: errors.length,
      n8n: 0,
      openai: 0,
      meta_send: 0,
      webhook: 0,
      db: 0,
    };
    errors.forEach((e) => {
      if (counts[e.step] !== undefined) {
        counts[e.step]++;
      }
    });
    return counts;
  }, [errors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111b21] dark:text-[#e9edef] leading-none">
                Error Log & Diagnostics
              </h1>
              <p className="text-xs text-[#8696a0] mt-1">
                Real-time failure monitoring & payload inspection · For warranty support
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9FAFB] dark:hover:bg-[#202c33] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D92228] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ErrorSummaryCards errors={errors} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-[#162026] p-3 sm:p-4 rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter error text, phone number, or inbound message..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33] text-xs text-[#1A1A1A] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#D92228]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Step Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          {[
            { id: 'all', label: 'All', count: stepCounts.all },
            { id: 'n8n', label: 'n8n', count: stepCounts.n8n },
            { id: 'openai', label: 'OpenAI', count: stepCounts.openai },
            { id: 'meta_send', label: 'Meta Send', count: stepCounts.meta_send },
            { id: 'webhook', label: 'Webhook', count: stepCounts.webhook },
            { id: 'db', label: 'Database', count: stepCounts.db },
          ].map((pill) => {
            const isActive = stepFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setStepFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#D92228] text-white shadow-xs'
                    : 'bg-[#F3F4F6] dark:bg-[#202c33] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#26353d]'
                }`}
              >
                {pill.label} ({pill.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Error Table Card */}
      <div className="bg-white dark:bg-[#111b21] rounded-2xl border border-gray-200/80 dark:border-[#222e35] shadow-xs overflow-hidden">
        <ErrorTable
          errors={filteredErrors}
          loading={loading}
          onInspectPayload={(err) => setSelectedError(err)}
        />
      </div>

      {/* Raw Payload Inspector Modal */}
      <ErrorPayloadModal
        errorLog={selectedError}
        onClose={() => setSelectedError(null)}
      />
    </div>
  );
}
