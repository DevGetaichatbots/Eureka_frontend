'use client';

import React from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmModal({ onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-7 h-7" />
        </div>

        {/* Text */}
        <h2 className="text-lg font-bold text-[#1A1A1A] text-center mb-1">
          Sign Out
        </h2>
        <p className="text-sm text-[#6B7280] text-center mb-6">
          Are you sure you want to log out of Eureka Jo CRM?
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#D92228] hover:bg-[#B71C21] text-white shadow-sm transition-colors cursor-pointer"
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
