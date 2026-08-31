'use client';

import React, { useState } from 'react';
import { Conversation } from '@/types';
import { formatKarachiDateTime, formatPhone, isWithin24Hours } from '@/lib/utils';
import {
  X,
  MoreVertical,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  ShieldCheck,
  Flame,
  Pause,
  Play,
  Plus,
  Tag,
  Building,
  DollarSign,
  MapPin,
  ExternalLink,
  Bot,
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
  const phone = formatPhone(contact?.wa_id);
  const activeWindow = isWithin24Hours(conversation.last_message_at);

  const [isPaused, setIsPaused] = useState(false);
  const [tags, setTags] = useState<string[]>([
    'Real Estate Lead',
    'Amman Listing',
    'Apartment Inquiry',
  ]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
      setShowAddTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

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
        {/* Large Profile Avatar & Primary Badges */}
        <div className="text-center">
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-24 h-24 rounded-3xl bg-[#FDEBEC] text-[#D92228] font-extrabold text-3xl flex items-center justify-center border border-[#F5C2C4] shadow-xs">
              {contactName[0]?.toUpperCase() || 'W'}
            </div>
            {activeWindow && (
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white ring-2 ring-[#16A34A]/20"
                title="Active 24h Window"
              />
            )}
          </div>

          <h4 className="font-bold text-base text-[#1A1A1A]">{contactName}</h4>
          <p className="font-mono text-xs text-[#6B7280] mt-0.5">+{contact?.wa_id}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Subscribed (WhatsApp)</span>
            </span>

            {activeWindow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Active 24h Window</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]">
                <Clock className="w-3.5 h-3.5" />
                <span>Past 24h Window</span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#D92228] hover:text-[#B71C21] hover:underline"
          >
            <span>All Channels History</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Automations Section */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-[#D92228]" />
              Automations (AI Bot)
            </span>
            <span className="text-[10px] text-[#6B7280]">n8n Workflow</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              isPaused
                ? 'bg-emerald-50 border-emerald-200 text-[#16A34A] hover:bg-emerald-100'
                : 'bg-white border-[#E5E7EB] text-[#1A1A1A] hover:bg-gray-50'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Resume Bot Automations</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-[#D92228]" />
                <span>Pause Bot Automations</span>
              </>
            )}
          </button>
        </div>

        {/* Contact Tags Section */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#D92228]" />
              Contact Tags
            </span>
            <button
              type="button"
              onClick={() => setShowAddTag(!showAddTag)}
              className="text-[11px] font-semibold text-[#D92228] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Tag</span>
            </button>
          </div>

          {showAddTag && (
            <form onSubmit={handleAddTag} className="flex gap-1.5">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="e.g. Villa Investor"
                className="flex-1 px-2.5 py-1 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D92228]"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-[#D92228] text-white rounded-lg font-semibold"
              >
                Save
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FDEBEC] text-[#D92228] border border-[#F5C2C4]"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-[#B71C21]"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Opted-In Channel */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-1 text-xs">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
            Opted-In Through
          </label>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F9FAFB] border border-[#E5E7EB] text-[#1A1A1A]">
              Direct WhatsApp Inbound
            </span>
          </div>
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

        {/* Real Estate Custom Fields */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs uppercase tracking-wider text-[#6B7280]">
              Real Estate Fields
            </h5>
            <span className="text-[10px] text-[#D92228] cursor-pointer hover:underline">
              Manage Fields
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#6B7280]">Preferred Location</label>
            <div className="flex items-center gap-2 text-[#1A1A1A] font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#D92228]" />
              <span>Amman, Jordan (Abdoun / Dabouq)</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#6B7280]">Property Category</label>
            <div className="flex items-center gap-2 text-[#1A1A1A] font-semibold">
              <Building className="w-3.5 h-3.5 text-[#D92228]" />
              <span>3-Bedroom Luxury Apartment</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-[#6B7280]">Budget Range</label>
            <div className="flex items-center gap-2 text-[#1A1A1A] font-semibold">
              <DollarSign className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>80,000 – 130,000 JOD</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
