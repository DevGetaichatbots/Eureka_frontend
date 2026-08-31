'use client';

import React, { useState } from 'react';
import { ErrorLog } from '@/types';
import { formatKarachiDateTime, formatPhone } from '@/lib/utils';
import {
  X,
  Copy,
  Check,
  Code2,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
} from 'lucide-react';

interface ErrorPayloadModalProps {
  errorLog: ErrorLog | null;
  onClose: () => void;
}

export function ErrorPayloadModal({ errorLog, onClose }: ErrorPayloadModalProps) {
  const [copied, setCopied] = useState(false);

  if (!errorLog) return null;

  const handleCopy = () => {
    if (errorLog.payload) {
      navigator.clipboard.writeText(JSON.stringify(errorLog.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStepColor = (step: string) => {
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#111b21] rounded-2xl border border-gray-200 dark:border-[#222e35] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 dark:border-[#222e35] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase border ${getStepColor(
                errorLog.step
              )}`}
            >
              {errorLog.step}
            </span>
            <h3 className="text-base font-bold text-[#111b21] dark:text-[#e9edef]">
              Diagnostic Error #{errorLog.id}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#111b21] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202c33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-[#202c33]/50 p-4 rounded-xl border border-gray-100 dark:border-[#222e35]">
            <div className="flex items-center gap-2 text-[#667781] dark:text-[#8696a0]">
              <Clock className="w-4 h-4 text-[#D92228]" />
              <span>Timestamp:</span>
              <strong className="text-[#111b21] dark:text-[#e9edef]">
                {formatKarachiDateTime(errorLog.created_at)}
              </strong>
            </div>

            <div className="flex items-center gap-2 text-[#667781] dark:text-[#8696a0]">
              <Phone className="w-4 h-4 text-[#D92228]" />
              <span>Phone:</span>
              <strong className="text-[#111b21] dark:text-[#e9edef]">
                {formatPhone(errorLog.wa_id)}
              </strong>
            </div>
          </div>

          {/* Inbound Customer Prompt */}
          {errorLog.inbound_body && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#D92228]" />
                Inbound Customer Prompt
              </label>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202c33]/70 border border-gray-200/80 dark:border-[#222e35] text-xs font-medium text-[#111b21] dark:text-[#e9edef]">
                &ldquo;{errorLog.inbound_body}&rdquo;
              </div>
            </div>
          )}

          {/* Error Details Banner */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Error Description
            </label>
            <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300 font-mono leading-relaxed">
              {errorLog.error_text}
            </div>
          </div>

          {/* Raw JSON Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#D92228]" />
                Raw JSON Payload
              </label>

              {errorLog.payload && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] hover:bg-gray-200 dark:hover:bg-[#202c33]/80 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#222e35] bg-[#0b141a]">
              <pre className="p-4 text-xs font-mono text-[#e9edef] overflow-x-auto max-h-56 leading-relaxed">
                {errorLog.payload
                  ? JSON.stringify(errorLog.payload, null, 2)
                  : '// No raw payload recorded for this event.'}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-[#222e35] bg-gray-50/50 dark:bg-[#202c33]/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] hover:bg-gray-300 dark:hover:bg-[#202c33]/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
