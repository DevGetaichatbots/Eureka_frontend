'use client';

import React from 'react';
import { Conversation } from '@/types';
import { formatKarachiDateTime } from '@/lib/utils';
import {
  X,
  MoreVertical,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface ContactDetailsDrawerProps {
  conversation: Conversation;
  totalMessages: number;
  onClose?: () => void;
}

export function ContactDetailsDrawer({
  conversation,
  totalMessages,
  onClose,
}: ContactDetailsDrawerProps) {
  const contact = conversation.contact;
  const contactName = contact?.profile_name || 'WhatsApp Contact';

  return (
    <aside className="w-80 flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col h-full overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-bold text-sm text-[#1A1A1A] truncate">{contactName}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-colors cursor-pointer"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Large Profile Avatar */}
        <div className="text-center">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-24 h-24 rounded-3xl bg-[#FDEBEC] text-[#D92228] font-extrabold text-3xl flex items-center justify-center border border-[#F5C2C4] shadow-xs">
              {contactName[0]?.toUpperCase() || 'W'}
            </div>
          </div>

          <h4 className="font-bold text-base text-[#1A1A1A]">{contactName}</h4>
          <p className="font-mono text-xs text-[#6B7280] mt-0.5">+{contact?.wa_id}</p>
        </div>

        {/* System Fields */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-3 text-xs">
          <h5 className="font-bold text-xs uppercase tracking-wider text-[#6B7280]">
            System Fields
          </h5>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#6B7280]">Phone (E.164)</label>
            <div className="flex items-center gap-2 text-[#1A1A1A] font-mono">
              <Phone className="w-3.5 h-3.5 text-[#D92228]" />
              <span>+{contact?.wa_id}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#6B7280]">First Inbound Contact</label>
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <Calendar className="w-3.5 h-3.5 text-[#D92228]" />
              <span>{formatKarachiDateTime(contact?.first_seen_at)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#6B7280]">Last Active Timestamp</label>
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <Clock className="w-3.5 h-3.5 text-[#D92228]" />
              <span>{formatKarachiDateTime(conversation.last_message_at)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#6B7280]">Messages in Thread</label>
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <MessageSquare className="w-3.5 h-3.5 text-[#D92228]" />
              <span>{totalMessages} messages</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
