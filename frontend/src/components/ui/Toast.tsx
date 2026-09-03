'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, variant = 'success', duration = 3500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onClose]);

  const styles: Record<ToastVariant, { bg: string; border: string; icon: React.ReactNode }> = {
    success: {
      bg: 'bg-white',
      border: 'border-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    },
    error: {
      bg: 'bg-white',
      border: 'border-red-200',
      icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
    },
  };

  const s = styles[variant];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${s.bg} ${s.border} transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ minWidth: '260px', maxWidth: '380px' }}
    >
      {s.icon}
      <span className="flex-1 text-sm font-medium text-[#1A1A1A]">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="ml-1 p-0.5 rounded-lg text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast container to render multiple toasts
export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}
