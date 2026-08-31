'use client';

import React from 'react';
import { ErrorLog } from '@/types';
import { AlertTriangle, Bot, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ErrorSummaryCardsProps {
  errors: ErrorLog[];
}

export function ErrorSummaryCards({ errors }: ErrorSummaryCardsProps) {
  const total = errors.length;
  const n8nErrors = errors.filter((e) => e.step === 'n8n' || e.step === 'openai').length;
  const metaErrors = errors.filter((e) => e.step === 'meta_send' || e.step === 'webhook').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Errors */}
      <div className="bg-white dark:bg-[#111b21] p-5 rounded-2xl border border-gray-200/80 dark:border-[#222e35] shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
            Total Pipeline Failures
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold text-[#111b21] dark:text-[#e9edef]">
              {total}
            </span>
            <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
              Warranty Support Log
            </span>
          </div>
        </div>
      </div>

      {/* n8n / AI Workflow Errors */}
      <div className="bg-white dark:bg-[#111b21] p-5 rounded-2xl border border-gray-200/80 dark:border-[#222e35] shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
            n8n / AI Timeouts
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold text-[#111b21] dark:text-[#e9edef]">
              {n8nErrors}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Fallback Sent
            </span>
          </div>
        </div>
      </div>

      {/* Meta API & Webhook Failures */}
      <div className="bg-white dark:bg-[#111b21] p-5 rounded-2xl border border-gray-200/80 dark:border-[#222e35] shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center flex-shrink-0">
          <Send className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
            Meta Cloud & Webhook
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold text-[#111b21] dark:text-[#e9edef]">
              {metaErrors}
            </span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              API & HMAC Guard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
