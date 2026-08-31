'use client';

import React from 'react';
import {
  Inbox,
  UserCheck,
  UserX,
  Clock,
  Flame,
  Heart,
  Plus,
  Bot,
  Users,
  AlertCircle,
  ChevronLeft,
  Tag,
  Building,
} from 'lucide-react';

interface InboxFolderSidebarProps {
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  counts: {
    all: number;
    active: number;
    bot: number;
    unassigned: number;
    reminders: number;
  };
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function InboxFolderSidebar({
  selectedFolder,
  onSelectFolder,
  counts,
  collapsed = false,
  onToggleCollapse,
}: InboxFolderSidebarProps) {
  if (collapsed) {
    return null;
  }

  return (
    <div className="w-56 sm:w-60 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col justify-between select-none h-full">
      {/* Scrollable folder categories */}
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#D92228]" />
            <span>Inbox</span>
          </h2>
          <span className="text-[11px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
            {counts.all}
          </span>
        </div>

        {/* Primary Folders */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectFolder('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFolder === 'all'
                ? 'bg-[#FDEBEC] text-[#D92228] font-bold shadow-xs'
                : 'text-[#1A1A1A] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="w-4 h-4 text-[#D92228]" />
              <span>All chats</span>
            </div>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                selectedFolder === 'all'
                  ? 'bg-white text-[#D92228] font-bold'
                  : 'text-[#6B7280]'
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFolder('active')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFolder === 'active'
                ? 'bg-[#FDEBEC] text-[#D92228] font-bold shadow-xs'
                : 'text-[#1A1A1A] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-[#16A34A]" />
              <span>Active 24h Window</span>
            </div>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                selectedFolder === 'active'
                  ? 'bg-white text-[#16A34A] font-bold'
                  : 'text-[#16A34A]'
              }`}
            >
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFolder('unassigned')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFolder === 'unassigned'
                ? 'bg-[#FDEBEC] text-[#D92228] font-bold shadow-xs'
                : 'text-[#1A1A1A] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserX className="w-4 h-4 text-[#6B7280]" />
              <span>Unassigned</span>
            </div>
            <span className="text-[11px] text-[#6B7280]">
              {counts.unassigned}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFolder('bot')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFolder === 'bot'
                ? 'bg-[#FDEBEC] text-[#D92228] font-bold shadow-xs'
                : 'text-[#1A1A1A] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-[#D92228]" />
              <span>Assigned to Bot</span>
            </div>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                selectedFolder === 'bot'
                  ? 'bg-white text-[#D92228] font-bold'
                  : 'text-[#6B7280]'
              }`}
            >
              {counts.bot}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFolder('reminders')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFolder === 'reminders'
                ? 'bg-[#FDEBEC] text-[#D92228] font-bold shadow-xs'
                : 'text-[#1A1A1A] hover:bg-[#F9FAFB]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#6B7280]" />
              <span>Reminders</span>
            </div>
            <span className="text-[11px] text-[#6B7280]">
              {counts.reminders}
            </span>
          </button>
        </div>

        {/* Labels Section */}
        <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#D92228]" />
              Labels
            </span>
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100 text-[#6B7280] hover:text-[#D92228] transition-colors"
              title="Add Label"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectFolder('favorites')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                selectedFolder === 'favorites'
                  ? 'bg-[#FDEBEC] text-[#D92228] font-bold'
                  : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>❤️</span>
                <span>Favorites</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectFolder('hot_leads')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                selectedFolder === 'hot_leads'
                  ? 'bg-[#FDEBEC] text-[#D92228] font-bold'
                  : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🔥</span>
                <span>Hot Inquiries</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectFolder('real_estate')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                selectedFolder === 'real_estate'
                  ? 'bg-[#FDEBEC] text-[#D92228] font-bold'
                  : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-[#D92228]" />
                <span>Amman Properties</span>
              </div>
            </button>
          </div>
        </div>

        {/* Team / Channel Section */}
        <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D92228]" />
              Team & AI Handover
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span className="text-[#16A34A]">Eureka Jo AI Bot</span>
              </div>
              <span className="text-[10px] text-[#16A34A] font-bold">LIVE</span>
            </div>

            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-[#6B7280]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Backup Alerts</span>
              </div>
              <span className="text-[10px]">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Collapse Toggle */}
      {onToggleCollapse && (
        <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-end">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
            title="Collapse folder panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
