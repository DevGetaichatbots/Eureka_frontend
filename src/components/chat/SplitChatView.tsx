'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Conversation, Message, Contact } from '@/types';
import { api } from '@/lib/api';
import {
  formatKarachiTime,
  formatKarachiDateTime,
  formatPhone,
  isWithin24Hours,
  formatDateDivider,
  karachiDateKey,
} from '@/lib/utils';
import { NavRail } from '@/components/navigation/NavRail';
import { ContactDetailsDrawer } from '@/components/chat/ContactDetailsDrawer';
import { MessageBubble } from '@/components/thread/MessageBubble';
import { DateDivider } from '@/components/thread/DateDivider';
import {
  Search,
  RefreshCw,
  X,
  Flame,
  Clock,
  MessageSquare,
  Bot,
  User as UserIcon,
  Check,
  CheckCheck,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Phone,
  SlidersHorizontal,
  Bell,
  Tag,
  CheckSquare,
  Pause,
  Play,
  PanelRightClose,
  PanelRightOpen,
  Filter,
} from 'lucide-react';

interface SplitChatViewProps {
  initialId?: number;
}

export function SplitChatView({ initialId }: SplitChatViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected conversation ID from URL or initialId
  const parsedId = Number(searchParams.get('id'));
  const urlId =
    Number.isFinite(parsedId) && parsedId > 0 ? parsedId : initialId;

  // Conversations list state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [chatFilter, setChatFilter] = useState<'open' | 'active24h' | 'closed'>('open');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedId, setSelectedId] = useState<number | null>(urlId || null);

  // Layout drawer toggles
  const [collapseNavRail, setCollapseNavRail] = useState(false);
  const [collapseFolderSidebar, setCollapseFolderSidebar] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Active thread state
  const [activeData, setActiveData] = useState<{
    conversation: Conversation;
    messages: Message[];
  } | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [refreshingThread, setRefreshingThread] = useState(false);
  const [messageRange, setMessageRange] = useState<'all' | 'today' | 'yesterday' | '3' | '7' | '30' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Lightbox
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Scroll the message pane only — never the whole page
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastMessageKeyRef = useRef('');
  const prevSelectedIdRef = useRef<number | null>(null);

  // Fetch conversations with auto-polling for incoming messages
  const loadConversations = async (showLoading = false) => {
    try {
      if (showLoading) setLoadingList(true);
      const res = await api.getConversations();
      setConversations(res.items || []);
      setListError(null);

      setSelectedId((prev) => (prev ? prev : (res.items.length > 0 ? res.items[0].id : null)));
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      if (showLoading) {
        setListError(err?.message || 'Failed to load conversations. Check your connection.');
      }
    } finally {
      if (showLoading) setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
    // Poll every 8 seconds so newly received WhatsApp messages appear live
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadConversations(false);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active conversation messages with 5s silent auto-polling so new messages appear live
  useEffect(() => {
    if (!selectedId) return;

    let isMounted = true;

    // Clear stale data and reset message filters when switching conversations
    setActiveData(null);
    setThreadError(null);
    setMessageRange('all');
    setCustomStart('');
    setCustomEnd('');

    async function fetchThread(showSpinner = false) {
      try {
        if (showSpinner) setLoadingThread(true);
        const data = await api.getConversation(selectedId!);
        if (isMounted) {
          setThreadError(null);
          setActiveData((prev) => {
            const prevMax = prev?.messages?.length
              ? Math.max(...prev.messages.map((m) => m.id || 0))
              : 0;
            const nextMax = data?.messages?.length
              ? Math.max(...data.messages.map((m) => m.id || 0))
              : 0;
            if (
              prev &&
              prev.conversation?.id === data.conversation?.id &&
              prev.messages.length === data.messages.length &&
              prevMax === nextMax
            ) {
              return prev;
            }
            if (nextMax > prevMax) {
              stickToBottomRef.current = true;
            }
            return data;
          });
        }
      } catch (err: any) {
        console.error(`Failed to load conversation #${selectedId}:`, err);
        if (isMounted) {
          setThreadError(err?.message || 'Failed to load conversation messages.');
        }
      } finally {
        if (showSpinner && isMounted) setLoadingThread(false);
      }
    }

    fetchThread(true);

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchThread(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [selectedId]);

  const handleRefreshThread = async () => {
    try {
      setRefreshingThread(true);
      stickToBottomRef.current = true;
      await loadConversations(false);
      if (selectedId) {
        const data = await api.getConversation(selectedId);
        setActiveData(data);
      }
    } catch (err) {
      console.error('Failed to reload conversation:', err);
    } finally {
      setRefreshingThread(false);
    }
  };

  const sortedMessages = useMemo(() => {
    if (!activeData?.messages?.length) return [];
    const ordered = [...activeData.messages].sort((a, b) => (a.id || 0) - (b.id || 0));

    if (messageRange === 'all') return ordered;

    // Helper: get today's date key in Karachi timezone
    const todayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    if (messageRange === 'today') {
      return ordered.filter((m) => karachiDateKey(m.sent_at || m.created_at) === todayKey);
    }

    if (messageRange === 'yesterday') {
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yesterdayKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(yd);
      return ordered.filter((m) => {
        const d = karachiDateKey(m.sent_at || m.created_at);
        return d === todayKey || d === yesterdayKey;
      });
    }

    if (messageRange === 'custom') {
      if (!customStart && !customEnd) return ordered;
      // Compare using Karachi date strings (YYYY-MM-DD) so timezone is handled correctly
      return ordered.filter((m) => {
        const msgDate = karachiDateKey(m.sent_at || m.created_at);
        if (!msgDate) return false;
        if (customStart && msgDate < customStart) return false;
        if (customEnd && msgDate > customEnd) return false;
        return true;
      });
    }

    // Numeric range: "Last N days" — compare Karachi date strings
    const days = Number(messageRange);
    // Build the cutoff date key: today minus (days-1) days, expressed as YYYY-MM-DD in PKT
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (days - 1));
    const cutoffKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(cutoffDate);

    return ordered.filter((m) => {
      const msgDate = karachiDateKey(m.sent_at || m.created_at);
      return !!msgDate && msgDate >= cutoffKey;
    });
  }, [activeData?.messages, messageRange, customStart, customEnd]);

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight < 96;

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    stickToBottomRef.current = isNearBottom(el);
  };

  // Keep the thread pinned to the latest message unless the user scrolled up to read history
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const last = sortedMessages[sortedMessages.length - 1];
    const key = last ? `${last.id}:${last.sent_at}` : 'empty';
    const switchedConversation = prevSelectedIdRef.current !== selectedId;
    prevSelectedIdRef.current = selectedId;

    if (switchedConversation) {
      stickToBottomRef.current = true;
      lastMessageKeyRef.current = key;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      return;
    }

    const hasNewMessage = key !== lastMessageKeyRef.current;
    lastMessageKeyRef.current = key;

    if (hasNewMessage) {
      stickToBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
    }
  }, [sortedMessages, selectedId]);

  // Counts for folders
  const folderCounts = useMemo(() => {
    const total = conversations.length;
    const active = conversations.filter((c) => isWithin24Hours(c.last_message_at)).length;
    return {
      all: total,
      active,
      bot: total,
      unassigned: 0,
      reminders: 1,
    };
  }, [conversations]);

  // Filtered & Sorted conversations list
  const filteredConversations = useMemo(() => {
    const rows = conversations
      .filter((conv) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (conv.contact?.profile_name || '').toLowerCase();
          const phone = (conv.contact?.wa_id || '').toLowerCase();
          const lastMsg = (conv.last_message?.body || '').toLowerCase();
          if (!name.includes(q) && !phone.includes(q) && !lastMsg.includes(q)) {
            return false;
          }
        }

        if (selectedFolder === 'active') {
          if (!isWithin24Hours(conv.last_message_at)) return false;
        } else if (selectedFolder === 'unassigned') {
          return false;
        } else if (selectedFolder === 'reminders') {
          if (conv.id !== 2) return false;
        } else if (selectedFolder === 'favorites') {
          if (conv.id !== 1) return false;
        } else if (selectedFolder === 'hot_leads') {
          if (!isWithin24Hours(conv.last_message_at)) return false;
        }

        if (chatFilter === 'active24h') {
          return isWithin24Hours(conv.last_message_at);
        }
        if (chatFilter === 'closed') {
          return !isWithin24Hours(conv.last_message_at);
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.last_message_at).getTime();
        const timeB = new Date(b.last_message_at).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });

    const seen = new Set<string>();
    return rows.filter((conv) => {
      const key = String(conv.contact_id || conv.contact?.wa_id || conv.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [conversations, searchQuery, selectedFolder, chatFilter, sortOrder]);

  // Select a conversation — state-driven, no URL navigation to avoid re-render conflicts
  const handleSelectConversation = (id: number) => {
    if (id === selectedId) return; // already selected
    setSelectedId(id);
    // Update URL without triggering navigation/re-render
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/conversations?id=${id}`);
    }
  };

  return (
    <div className="flex w-full h-full min-h-0 bg-white select-none overflow-hidden font-sans">
      {/* COLUMN 1: Far-Left Icon Navigation Rail */}
      <NavRail
        collapsed={collapseNavRail}
        onToggleCollapse={() => setCollapseNavRail(!collapseNavRail)}
      />

      {/* COLUMN 2: Conversation Thread List Pane */}
      <div className="w-80 sm:w-88 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col h-full min-h-0 z-10">
        {/* Top Control / Filter Bar */}
        <div className="p-3 border-b border-[#E5E7EB] space-y-2 bg-white">
          {/* Quick Filter Controls matching reference screenshot */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            {/* Open Chats Dropdown */}
            <div className="relative inline-block">
              <select
                value={chatFilter}
                onChange={(e) => setChatFilter(e.target.value as any)}
                className="appearance-none pl-2.5 pr-6 py-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D92228] cursor-pointer"
              >
                <option value="open">💬 Open Chats</option>
                <option value="active24h">🔥 Active 24h</option>
                <option value="closed">⏱ Closed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Unread Pill Toggle */}
            <button
              type="button"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                showUnreadOnly
                  ? 'bg-[#FDEBEC] border-[#F5C2C4] text-[#D92228]'
                  : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
              }`}
            >
              Unread
            </button>

            {/* Sort: Newest ▾ Dropdown */}
            <div className="relative inline-block">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="appearance-none pl-2.5 pr-6 py-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#D92228] cursor-pointer"
              >
                <option value="newest">⇅ Sort: Newest</option>
                <option value="oldest">⇅ Sort: Oldest</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Search input within list */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by contact name or message..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#D92228] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
          {loadingList ? (
            <div className="p-8 text-center text-[#6B7280]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#D92228] mb-2" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : listError && conversations.length === 0 ? (
            <div className="p-8 text-center text-[#6B7280]">
              <X className="w-8 h-8 mx-auto text-[#D92228] mb-2 opacity-60" />
              <p className="text-xs font-semibold text-[#D92228]">Failed to load conversations</p>
              <p className="text-[11px] text-[#6B7280] mt-1 max-w-[200px] mx-auto">{listError}</p>
              <button
                type="button"
                onClick={() => loadConversations(true)}
                className="mt-3 px-3 py-1.5 rounded-lg bg-[#FDEBEC] text-[#D92228] text-xs font-semibold hover:bg-[#F5C2C4] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[#6B7280]">
              <MessageSquare className="w-8 h-8 mx-auto text-[#9CA3AF] mb-2 opacity-60" />
              <p className="text-xs font-semibold text-[#1A1A1A]">No conversations found</p>
              <p className="text-[11px] text-[#6B7280] mt-1">Try resetting your filters</p>
            </div>
          ) : (
            (() => {
              // Build Today / Yesterday / date-string group dividers (WhatsApp-style)
              const todayKey = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Karachi',
                year: 'numeric', month: '2-digit', day: '2-digit',
              }).format(new Date());
              const yesterdayDate = new Date();
              yesterdayDate.setDate(yesterdayDate.getDate() - 1);
              const yesterdayKey = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Karachi',
                year: 'numeric', month: '2-digit', day: '2-digit',
              }).format(yesterdayDate);

              const getGroupLabel = (dateKey: string) => {
                if (dateKey === todayKey) return 'Today';
                if (dateKey === yesterdayKey) return 'Yesterday';
                // e.g. "30 Aug 2026"
                try {
                  return new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Karachi',
                    day: 'numeric', month: 'long', year: 'numeric',
                  }).format(new Date(dateKey));
                } catch { return dateKey; }
              };

              let lastGroupKey = '';
              const items: React.ReactNode[] = [];

              filteredConversations.forEach((conv) => {
                const isSelected = conv.id === selectedId;
                const contactName = conv.contact?.profile_name || 'WhatsApp Contact';
                const active = isWithin24Hours(conv.last_message_at);
                const lastMsg = conv.last_message;
                const isBotMsg = lastMsg?.direction === 'bot';
                const groupKey = karachiDateKey(conv.last_message_at);

                // Insert a date divider when the group changes
                if (groupKey && groupKey !== lastGroupKey) {
                  lastGroupKey = groupKey;
                  items.push(
                    <div
                      key={`divider-${groupKey}`}
                      className="sticky top-0 z-10 px-4 py-1 bg-[#F3F4F6] border-y border-[#E5E7EB] flex items-center justify-center"
                    >
                      <span className="text-[10px] font-semibold text-[#6B7280] tracking-wide uppercase">
                        {getGroupLabel(groupKey)}
                      </span>
                    </div>
                  );
                }

                items.push(
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`p-3.5 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#FDEBEC]/40 border-l-4 border-[#D92228]'
                        : 'bg-white hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Contact Avatar */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-full bg-[#FDEBEC] text-[#D92228] font-bold text-sm flex items-center justify-center border border-[#F5C2C4]">
                          {contactName[0]?.toUpperCase() || 'W'}
                        </div>
                        {active && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white ring-1 ring-[#16A34A]/20"
                            title="Active 24h Customer Window"
                          />
                        )}
                      </div>

                      {/* Contact Info & Message Snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1 mb-0.5">
                          <h3
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-[#D92228]' : 'text-[#1A1A1A]'
                            }`}
                          >
                            {contactName}
                          </h3>
                          <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap flex-shrink-0 font-mono">
                            {formatKarachiTime(lastMsg?.sent_at || lastMsg?.created_at || conv.last_message_at)}
                          </span>
                        </div>

                        <p className="text-xs text-[#6B7280] truncate leading-relaxed">
                          {isBotMsg ? (
                            <span className="text-[#D92228] font-medium mr-1">You:</span>
                          ) : null}
                          {lastMsg?.body || 'Attachment'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              });

              return <>{items}</>;
            })()
          )}
        </div>
      </div>

      {/* COLUMN 4: Middle Main Chat Viewport */}
      <div className="flex-1 flex flex-col h-full min-h-0 bg-white relative min-w-0">
        {activeData ? (
          <>
            {/* Top Contact Header Bar matching reference screenshot */}
            <div className="px-3.5 sm:px-6 py-3 border-b border-[#E5E7EB] bg-white shadow-xs z-10 flex-shrink-0 space-y-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#FDEBEC] text-[#D92228] font-bold text-sm flex items-center justify-center border border-[#F5C2C4] shadow-xs flex-shrink-0">
                  {activeData.conversation.contact?.profile_name?.[0]?.toUpperCase() || 'W'}
                </div>
                <h2 className="text-sm font-bold text-[#1A1A1A] truncate flex-1 min-w-0">
                  {activeData.conversation.contact?.profile_name || 'WhatsApp Contact'}
                </h2>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleRefreshThread}
                    disabled={refreshingThread}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#1A1A1A] hover:text-[#D92228] hover:bg-[#FDEBEC] hover:border-[#F5C2C4] transition-colors cursor-pointer disabled:opacity-60"
                    title="Reload latest WhatsApp messages"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-[#D92228] ${
                        refreshingThread ? 'animate-spin' : ''
                      }`}
                    />
                    {refreshingThread ? 'Reloading' : 'Reload'}
                  </button>
                  <select
                    value={messageRange}
                    onChange={(e) => setMessageRange(e.target.value as typeof messageRange)}
                    className={`pl-2.5 pr-2 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D92228] cursor-pointer transition-colors ${
                      messageRange !== 'all'
                        ? 'border-[#D92228] bg-[#FDEBEC] text-[#D92228]'
                        : 'border-[#E5E7EB] bg-white text-[#1A1A1A]'
                    }`}
                    title="Filter messages by date"
                  >
                    <option value="all">All messages</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="3">Last 3 days</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="custom">Custom calendar</option>
                  </select>
                  {messageRange !== 'all' && (
                    <button
                      type="button"
                      onClick={() => { setMessageRange('all'); setCustomStart(''); setCustomEnd(''); }}
                      className="p-1.5 rounded-lg bg-[#FDEBEC] text-[#D92228] hover:bg-[#F5C2C4] transition-colors"
                      title="Clear date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="p-2 rounded-xl text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors"
                    title="Snooze / Reminder"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-xl text-[#6B7280] hover:text-[#16A34A] hover:bg-emerald-50 transition-colors"
                    title="Mark Resolved"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-xl text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-colors"
                    title="Add Tag"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      showDetails
                        ? 'bg-[#FDEBEC] border-[#F5C2C4] text-[#D92228]'
                        : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
                    }`}
                    title="Toggle Contact CRM Drawer"
                  >
                    {showDetails ? (
                      <PanelRightClose className="w-4 h-4" />
                    ) : (
                      <PanelRightOpen className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pl-[3.25rem]">
                <span className="text-[11px] font-medium text-[#6B7280] whitespace-nowrap">
                  Assigned to:
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D92228] bg-[#FDEBEC] px-2 py-0.5 rounded-md whitespace-nowrap">
                  <Bot className="w-3 h-3" />
                  Eureka Jo AI Bot
                </span>
                {messageRange === 'custom' && (
                  <span className="flex items-center gap-1">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-1.5 py-1 rounded-lg border border-[#E5E7EB] text-[11px] text-[#1A1A1A]"
                      title="Start date"
                    />
                    <span className="text-[10px] text-[#9CA3AF]">to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-1.5 py-1 rounded-lg border border-[#E5E7EB] text-[11px] text-[#1A1A1A]"
                      title="End date"
                    />
                  </span>
                )}
                {/* Filter result count — always visible when filter is active so user can see it working */}
                {messageRange !== 'all' && activeData?.messages?.length != null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FDEBEC] text-[#D92228] border border-[#F5C2C4] whitespace-nowrap">
                    <Filter className="w-2.5 h-2.5" />
                    {sortedMessages.length} / {activeData.messages.length} messages
                  </span>
                )}
              </div>
            </div>

            {/* Platform Tab Indicator Banner matching reference screenshot */}
            <div className="px-6 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between gap-3 text-xs flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  WhatsApp Cloud API
                </span>
                <span className="text-[11px] text-[#6B7280] hidden md:inline">
                  +{activeData.conversation.contact?.wa_id}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#6B7280] text-[11px]">
                <span className="hidden lg:inline">
                  Eureka Jo AI Bot is actively responding to inquiries. Live human handover is on standby.
                </span>
                <span className="inline-block px-1.5 py-0.2 rounded bg-white border border-[#E5E7EB] font-mono text-[10px]">
                  n8n active
                </span>
              </div>
            </div>

            {/* Message Stream Viewport — isolated scrollbar, does not move the page */}
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-3 bg-white overscroll-contain"
            >
              {loadingThread ? (
                <div className="flex items-center justify-center h-full text-[#6B7280]">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#D92228] mr-2" />
                  <span className="text-xs font-semibold">Loading messages...</span>
                </div>
              ) : threadError ? (
                <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
                  <X className="w-10 h-10 text-[#D92228] mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-[#D92228]">Failed to load messages</p>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-sm text-center">
                    {threadError}
                  </p>
                  <button
                    type="button"
                    onClick={handleRefreshThread}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-[#FDEBEC] text-[#D92228] text-xs font-semibold hover:bg-[#F5C2C4] transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : sortedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
                  <MessageSquare className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-[#1A1A1A]">No messages yet</p>
                  <p className="text-xs text-[#6B7280]">
                    Inbound customer messages and bot replies will appear here.
                  </p>
                </div>
              ) : (
                sortedMessages.map((msg, index) => {
                  const prev = sortedMessages[index - 1];
                  const showDivider =
                    !prev ||
                    karachiDateKey(prev.sent_at || prev.created_at) !==
                      karachiDateKey(msg.sent_at || msg.created_at);

                  return (
                    <React.Fragment key={msg.id}>
                      {showDivider ? (
                        <DateDivider dateStr={msg.sent_at || msg.created_at} />
                      ) : null}
                      <MessageBubble
                        message={msg}
                        contactName={
                          activeData.conversation.contact?.profile_name || 'Customer'
                        }
                        onImageClick={(url) => setSelectedImage(url)}
                      />
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Read-Only Status Bar matching reference screenshot */}
            <div className="p-3 bg-[#F9FAFB] border-t border-[#E5E7EB] text-center text-xs text-[#6B7280] flex items-center justify-center gap-2 flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#D92228]" />
              <span>
                You have read-only rights to view this conversation. Automated replies are processed in real-time by Eureka Jo Bot.
              </span>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="font-semibold text-[#D92228] hover:underline cursor-pointer ml-1"
              >
                View Contact CRM
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#6B7280] p-8">
            <div className="w-16 h-16 rounded-3xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center mb-4 border border-[#F5C2C4]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Select a Conversation</h3>
            <p className="text-xs text-[#6B7280] mt-1 text-center max-w-sm">
              Choose an active thread from the inbox to review the live dialogue between the customer and Eureka Jo Bot.
            </p>
          </div>
        )}
      </div>

      {/* COLUMN 5: Far-Right CRM Customer 360 Drawer */}
      {showDetails && activeData && (
        <ContactDetailsDrawer
          conversation={activeData.conversation}
          totalMessages={activeData.messages.length}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img
              src={selectedImage}
              alt="Expanded WhatsApp Media"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
