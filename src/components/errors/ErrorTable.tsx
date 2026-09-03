'use client';

import React from 'react';
import { ErrorLog } from '@/types';
import { formatKarachiDateTime, formatPhone } from '@/lib/utils';
import {
  AlertTriangle,
  Code2,
  Clock,
  Phone,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

interface ErrorTableProps {
  errors: ErrorLog[];
  loading: boolean;
  onInspectPayload: (err: ErrorLog) => void;
}

export function ErrorTable({
  errors,
  loading,
  onInspectPayload,
}: ErrorTableProps) {
  const getStepBadge = (step: string) => {
    switch (step) {
      case 'n8n':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
      case 'meta_send':
        return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40';
      case 'webhook':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
      case 'openai':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40';
      case 'db':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      default:
        return 'bg-gray-50 dark:bg-[#202c33] text-[#8696a0] border-gray-200 dark:border-[#222e35]';
    }
  };

  if (loading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-[#222e35]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 flex items-center justify-between gap-4 animate-pulse">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-24" />
              <div className="h-3 bg-gray-200 dark:bg-[#202c33] rounded w-3/4" />
            </div>
            <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div className="py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-[#16A34A] flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-[#F3F4F6]">
          All pipelines healthy!
        </h3>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 max-w-xs mx-auto">
          No error records match your current filter. Bot messaging and webhook callbacks are running normally.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33]/40 text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
            <th className="py-3.5 px-4 sm:px-6">Step</th>
            <th className="py-3.5 px-4">Failure Description & Inbound Trigger</th>
            <th className="py-3.5 px-4 hidden md:table-cell">Affected Phone</th>
            <th className="py-3.5 px-4">Time</th>
            <th className="py-3.5 px-4 sm:px-6 text-right">Payload</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#26353d] text-xs">
          {errors.map((err) => {
            const phone = formatPhone(err.wa_id);

            return (
              <tr
                key={err.id}
                className="hover:bg-[#F9FAFB] dark:hover:bg-[#202c33]/40 transition-colors group"
              >
                {/* Step Badge */}
                <td className="py-4 px-4 sm:px-6 align-top">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase border ${getStepBadge(
                      err.step
                    )}`}
                  >
                    {err.step}
                  </span>
                </td>

                {/* Error Text & Inbound Prompt */}
                <td className="py-4 px-4 align-top max-w-md">
                  <p className="font-semibold text-xs text-[#1A1A1A] dark:text-[#F3F4F6] leading-relaxed break-words">
                    {err.error_text}
                  </p>

                  {err.inbound_body && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                      <MessageSquare className="w-3 h-3 text-[#D92228] flex-shrink-0" />
                      <span className="truncate italic">
                        Inbound: &ldquo;{err.inbound_body}&rdquo;
                      </span>
                    </div>
                  )}
                </td>

                {/* Affected Phone */}
                <td className="py-4 px-4 align-top hidden md:table-cell">
                  <span className="font-mono text-xs text-[#667781] dark:text-[#94a3b8] bg-gray-100 dark:bg-[#202c33] border border-transparent dark:border-[#2a3942] px-2 py-0.5 rounded-md">
                    {phone}
                  </span>
                </td>

                {/* Timestamp in Karachi */}
                <td className="py-4 px-4 align-top whitespace-nowrap text-[#667781] dark:text-[#94a3b8]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D92228]" />
                    <span>{formatKarachiDateTime(err.created_at)}</span>
                  </div>
                </td>

                {/* Action button */}
                <td className="py-4 px-4 sm:px-6 align-top text-right whitespace-nowrap">
                  <button
                    onClick={() => onInspectPayload(err)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#111b21] border border-gray-200 dark:border-[#222e35] text-[#111b21] dark:text-[#e9edef] hover:bg-[#D92228] hover:text-white hover:border-[#D92228] transition-all shadow-xs"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
