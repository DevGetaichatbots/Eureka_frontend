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
  ChevronUp,
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
  Archive,
  Trash2,
  Loader2,
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
  const [chatFilter, setChatFilter] = useState<'open' | 'active24h' | 'closed' | 'archived'>('open');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedId, setSelectedId] = useState<number | null>(urlId || null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(urlId ? 'chat' : 'list');

  // Layout drawer toggles
  const [collapseNavRail, setCollapseNavRail] = useState(false);
  const [collapseFolderSidebar, setCollapseFolderSidebar] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Active thread state
  const [activeData, setActiveData] = useState<{
    conversation: Conversation;
    messages: Message[];
  } | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [refreshingThread, setRefreshingThread] = useState(false);

  const loadingConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedId);
  }, [conversations, selectedId]);

  const [messageRange, setMessageRange] = useState<'all' | 'today' | 'yesterday' | '3' | '7' | '30' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // In-conversation message search state
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Archive & Delete states with localStorage persistence
  const [archivedIds, setArchivedIds] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eureka_archived_chats');
        if (saved) return new Set<number>(JSON.parse(saved));
      } catch {}
    }
    return new Set<number>();
  });

  const [deletedIds, setDeletedIds] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eureka_deleted_chats');
        if (saved) return new Set<number>(JSON.parse(saved));
      } catch {}
    }
    return new Set<number>();
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleToggleArchive = async () => {
    if (!selectedId) return;
    const currentlyArchived = archivedIds.has(selectedId);
    const newArchivedState = !currentlyArchived;

    // 1. Optimistic UI update immediately
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (newArchivedState) {
        next.add(selectedId);
      } else {
        next.delete(selectedId);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('eureka_archived_chats', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    // 2. Persist to database (including chat user name and details)
    try {
      const conv = conversations.find((c) => c.id === selectedId) || activeData?.conversation;
      const contactName = conv?.contact?.profile_name || activeData?.conversation?.contact?.profile_name || 'WhatsApp Contact';
      const waId = conv?.contact?.wa_id || activeData?.conversation?.contact?.wa_id || null;
      const contactId = conv?.contact_id || activeData?.conversation?.contact_id || null;
      const lastMsg = conv?.last_message?.body || (activeData?.messages?.length ? activeData.messages[activeData.messages.length - 1].body : null);
      const msgCount = conv?.message_count || activeData?.messages?.length || 0;

      await api.archiveConversation(selectedId, newArchivedState, {
        chat_user_name: contactName,
        wa_id: waId,
        contact_id: contactId,
        last_message: lastMsg,
        message_count: msgCount,
        archived_by_user: 'admin@eurekajo.com',
      });
    } catch (err) {
      console.error('Failed to persist archive status to Supabase:', err);
    }
  };

  // Open confirmation dialog box
  const handleDeleteConversation = () => {
    if (!selectedId) return;
    setShowDeleteModal(true);
  };

  // Confirmed delete: Hides from frontend across all users while keeping raw database intact
  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    const deletedConvId = selectedId;
    const targetConv = conversations.find((c) => c.id === deletedConvId) || activeData?.conversation;
    const waId = targetConv?.contact?.wa_id || null;
    const contactId = targetConv?.contact_id || targetConv?.contact?.id || null;

    // 1. Instantly hide from frontend UI state
    setDeletedIds((prev) => {
      const next = new Set(prev).add(deletedConvId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('eureka_deleted_chats', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    if (targetConv && typeof window !== 'undefined') {
      try {
        const savedWaIds = JSON.parse(localStorage.getItem('eureka_deleted_lead_wa_ids') || '[]');
        const waIdSet = new Set(savedWaIds);
        if (waId) {
          waIdSet.add(waId);
          const digits = waId.replace(/\D/g, '');
          if (digits) {
            waIdSet.add(digits);
            waIdSet.add(`+${digits}`);
          }
        }
        if (contactId) waIdSet.add(String(contactId));
        if (targetConv.id) waIdSet.add(String(targetConv.id));
        localStorage.setItem('eureka_deleted_lead_wa_ids', JSON.stringify(Array.from(waIdSet)));
        window.dispatchEvent(new Event('eureka_deleted_updated'));
      } catch {}
    }

    setShowDeleteModal(false);

    // Select next conversation in list smoothly
    const remaining = filteredConversations.filter((c) => c.id !== deletedConvId);
    if (remaining.length > 0) {
      handleSelectConversation(remaining[0].id);
    } else {
      setSelectedId(null);
      setActiveData(null);
    }

    // 2. Persist to database so ANY user who logs in anywhere will NEVER see this chat again (Soft-Delete: raw data preserved in Supabase)
    try {
      await api.deleteConversation(deletedConvId, {
        contact_id: contactId,
        wa_id: waId,
        deleted_by_user: 'admin@eurekajo.com',
      });
    } catch (err) {
      console.error('Failed to record deleted chat in Supabase:', err);
    }
  };

  useEffect(() => {
    const syncDeleted = () => {
      try {
        const savedChats = localStorage.getItem('eureka_deleted_chats');
        if (savedChats) {
          setDeletedIds(new Set<number>(JSON.parse(savedChats)));
        }
      } catch {}
    };
    window.addEventListener('storage', syncDeleted);
    window.addEventListener('eureka_deleted_updated', syncDeleted);
    return () => {
      window.removeEventListener('storage', syncDeleted);
      window.removeEventListener('eureka_deleted_updated', syncDeleted);
    };
  }, []);

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

      // Sync archived IDs from database
      if (res.items?.length) {
        setArchivedIds((prev) => {
          const next = new Set(prev);
          res.items.forEach((conv) => {
            if (conv.is_archived) {
              next.add(conv.id);
            }
          });
          return next;
        });
      }

      // Auto-sync all deleted conversation IDs to their contact phone numbers in localStorage
      if (typeof window !== 'undefined' && res.items?.length) {
        try {
          const savedChats = localStorage.getItem('eureka_deleted_chats');
          if (savedChats) {
            const delSet = new Set<number>(JSON.parse(savedChats));
            const waIdSet = new Set<string>(JSON.parse(localStorage.getItem('eureka_deleted_lead_wa_ids') || '[]'));
            res.items.forEach((conv) => {
              if (delSet.has(conv.id)) {
                if (conv.contact_id) waIdSet.add(String(conv.contact_id));
                if (conv.contact?.id) waIdSet.add(String(conv.contact.id));
                if (conv.contact?.wa_id) {
                  const raw = conv.contact.wa_id;
                  const digits = raw.replace(/\D/g, '');
                  waIdSet.add(raw);
                  if (digits) {
                    waIdSet.add(digits);
                    waIdSet.add(`+${digits}`);
                  }
                }
              }
            });
            localStorage.setItem('eureka_deleted_lead_wa_ids', JSON.stringify(Array.from(waIdSet)));
            window.dispatchEvent(new Event('eureka_deleted_updated'));
          }
        } catch {}
      }
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
    setShowInChatSearch(false);
    setInChatSearch('');
    setActiveMatchIndex(0);

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

  // In-conversation message search matching & navigation
  const matchingMessageIds = useMemo(() => {
    if (!inChatSearch.trim() || !sortedMessages.length) return [];
    const q = inChatSearch.toLowerCase().trim();
    return sortedMessages
      .filter((m) => (m.body || '').toLowerCase().includes(q))
      .map((m) => m.id);
  }, [sortedMessages, inChatSearch]);

  const scrollToMatchedMessage = (targetId: number) => {
    if (!targetId) return;
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNextMatch = () => {
    if (!matchingMessageIds.length) return;
    const nextIdx = (activeMatchIndex + 1) % matchingMessageIds.length;
    setActiveMatchIndex(nextIdx);
    scrollToMatchedMessage(matchingMessageIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (!matchingMessageIds.length) return;
    const prevIdx =
      (activeMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setActiveMatchIndex(prevIdx);
    scrollToMatchedMessage(matchingMessageIds[prevIdx]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInChatSearch('');
      setActiveMatchIndex(0);
      setShowInChatSearch(false);
    }
  };

  // Global shortcut to trigger search (Ctrl+F or Cmd+F)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && activeData) {
        e.preventDefault();
        setShowInChatSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeData]);

  // When search query is entered and matches change, auto-jump to the first match
  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      setActiveMatchIndex(0);
      scrollToMatchedMessage(matchingMessageIds[0]);
    }
  }, [inChatSearch]);

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
    const nonDeleted = conversations.filter((c) => !deletedIds.has(c.id));
    const archivedCount = nonDeleted.filter((c) => archivedIds.has(c.id)).length;
    const nonArchived = nonDeleted.filter((c) => !archivedIds.has(c.id));
    const total = nonArchived.length;
    const active = nonArchived.filter((c) => isWithin24Hours(c.last_message_at)).length;
    return {
      all: total,
      active,
      bot: total,
      unassigned: 0,
      reminders: 1,
      archived: archivedCount,
    };
  }, [conversations, archivedIds, deletedIds]);

  // Filtered & Sorted conversations list
  const filteredConversations = useMemo(() => {
    const rows = conversations
      .filter((conv) => {
        if (deletedIds.has(conv.id)) return false;

        const isArchived = archivedIds.has(conv.id);
        if (selectedFolder === 'archived' || chatFilter === 'archived') {
          if (!isArchived) return false;
        } else {
          if (isArchived) return false;
        }

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
  }, [conversations, searchQuery, selectedFolder, chatFilter, sortOrder, archivedIds, deletedIds]);

  // Select a conversation — state-driven, no URL navigation to avoid re-render conflicts
  const handleSelectConversation = (id: number) => {
    if (id !== selectedId) {
      setSelectedId(id);
    }
    setMobileView('chat');
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
      <div
        className={`${
          mobileView === 'list' ? 'flex w-full' : 'hidden'
        } md:flex md:w-80 lg:w-88 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex-col h-full min-h-0 z-10`}
      >
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
                <option value="archived">📦 Archived ({archivedIds.size})</option>
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
              {selectedFolder === 'archived' || chatFilter === 'archived' ? (
                <>
                  <Archive className="w-8 h-8 mx-auto text-[#D92228] mb-2 opacity-70" />
                  <p className="text-xs font-semibold text-[#1A1A1A]">No archived chats</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">Archived conversations will appear here</p>
                </>
              ) : (
                <>
                  <MessageSquare className="w-8 h-8 mx-auto text-[#9CA3AF] mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-[#1A1A1A]">No conversations found</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">Try resetting your filters</p>
                </>
              )}
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

      {/* COLUMN 3: Middle Main Chat Viewport */}
      <div
        className={`${
          mobileView === 'chat' ? 'flex w-full' : 'hidden'
        } md:flex flex-1 flex-col h-full min-h-0 bg-white relative min-w-0`}
      >
        {activeData ? (
          <>
            {/* Top Contact Header Bar matching reference screenshot */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[#E5E7EB] bg-white shadow-xs z-10 flex-shrink-0 space-y-2">
              {showInChatSearch || inChatSearch.trim() ? (
                /* Dedicated Full-Width In-Conversation Search Header */
                <div className="flex items-center gap-2 w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInChatSearch(false);
                      setInChatSearch('');
                      setActiveMatchIndex(0);
                    }}
                    className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-colors cursor-pointer flex-shrink-0"
                    title="Close search (Esc)"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex-shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      autoFocus
                      value={inChatSearch}
                      onChange={(e) => setInChatSearch(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={`Search in chat (${activeData.conversation.contact?.profile_name || 'contact'})...`}
                      className="w-full pl-9 pr-28 sm:pr-36 py-1.5 sm:py-2 rounded-xl border border-[#D92228] bg-white ring-1 ring-[#D92228]/20 shadow-xs text-xs sm:text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none"
                    />

                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {inChatSearch.trim() && (
                        <span
                          className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                            matchingMessageIds.length > 0
                              ? 'bg-[#FDEBEC] text-[#D92228]'
                              : 'bg-gray-100 text-[#6B7280]'
                          }`}
                        >
                          {matchingMessageIds.length > 0
                            ? `${activeMatchIndex + 1}/${matchingMessageIds.length}`
                            : '0 found'}
                        </span>
                      )}

                      {matchingMessageIds.length > 1 && (
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={handlePrevMatch}
                            className="p-1 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-gray-100 cursor-pointer"
                            title="Previous match (Shift+Enter)"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextMatch}
                            className="p-1 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-gray-100 cursor-pointer"
                            title="Next match (Enter)"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setInChatSearch('');
                          setActiveMatchIndex(0);
                          setShowInChatSearch(false);
                        }}
                        className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#D92228] hover:bg-[#FDEBEC] cursor-pointer"
                        title="Clear & close search (Esc)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Normal Contact Header */
                <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
                  {/* Left: Avatar & Contact Info */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {/* Mobile Back Button */}
                    <button
                      type="button"
                      onClick={() => setMobileView('list')}
                      className="p-1.5 -ml-1 rounded-xl text-[#1A1A1A] hover:bg-[#FDEBEC] hover:text-[#D92228] transition-colors md:hidden cursor-pointer flex-shrink-0"
                      title="Back to conversations list"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FDEBEC] text-[#D92228] font-bold text-xs sm:text-sm flex items-center justify-center border border-[#F5C2C4] shadow-xs flex-shrink-0">
                      {activeData.conversation.contact?.profile_name?.[0]?.toUpperCase() || 'W'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xs sm:text-sm font-bold text-[#1A1A1A] truncate" title={activeData.conversation.contact?.profile_name || 'WhatsApp Contact'}>
                        {activeData.conversation.contact?.profile_name || 'WhatsApp Contact'}
                      </h2>
                      <p className="text-[10px] text-[#6B7280] font-mono sm:hidden truncate">
                        +{activeData.conversation.contact?.wa_id}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions (Search, Reload, Archive, Delete, Message Range, CRM Drawer) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                    {/* Search in chat toggle button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowInChatSearch(true);
                        setTimeout(() => searchInputRef.current?.focus(), 50);
                      }}
                      className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#1A1A1A] hover:text-[#D92228] hover:bg-[#FDEBEC] hover:border-[#F5C2C4] transition-colors cursor-pointer"
                      title="Search messages in this chat (Ctrl+F)"
                    >
                      <Search className="w-3.5 h-3.5 text-[#D92228] flex-shrink-0" />
                      <span className="hidden xl:inline">Search</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRefreshThread}
                      disabled={refreshingThread}
                      className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#1A1A1A] hover:text-[#D92228] hover:bg-[#FDEBEC] hover:border-[#F5C2C4] transition-colors cursor-pointer disabled:opacity-60"
                      title="Reload latest WhatsApp messages"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-[#D92228] flex-shrink-0 ${
                          refreshingThread ? 'animate-spin' : ''
                        }`}
                      />
                      <span className="hidden xl:inline">{refreshingThread ? 'Reloading' : 'Reload'}</span>
                    </button>

                    {/* Archive Button */}
                    <button
                      type="button"
                      onClick={handleToggleArchive}
                      className={`inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        activeData && archivedIds.has(activeData.conversation.id)
                          ? 'bg-[#FDEBEC] border-[#F5C2C4] text-[#D92228]'
                          : 'border-[#E5E7EB] text-[#1A1A1A] hover:text-[#D92228] hover:bg-[#FDEBEC] hover:border-[#F5C2C4]'
                      }`}
                      title={activeData && archivedIds.has(activeData.conversation.id) ? 'Unarchive conversation' : 'Archive conversation'}
                    >
                      <Archive className="w-3.5 h-3.5 text-[#D92228] flex-shrink-0" />
                      <span className="hidden xl:inline">
                        {activeData && archivedIds.has(activeData.conversation.id) ? 'Archived' : 'Archive'}
                      </span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#1A1A1A] hover:text-[#D92228] hover:bg-[#FDEBEC] hover:border-[#F5C2C4] transition-colors cursor-pointer"
                      title="Delete conversation from inbox"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#D92228] flex-shrink-0" />
                      <span className="hidden xl:inline">Delete</span>
                    </button>

                    <select
                      value={messageRange}
                      onChange={(e) => setMessageRange(e.target.value as typeof messageRange)}
                      className={`pl-2 pr-1 sm:pl-2.5 sm:pr-2 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D92228] cursor-pointer transition-colors max-w-[85px] sm:max-w-[110px] xl:max-w-none truncate ${
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
                      onClick={() => setShowDetails(!showDetails)}
                      className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
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
              )}

              {messageRange !== 'all' && (
                <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-[3.25rem]">
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
                  {/* Filter result count */}
                  {activeData?.messages?.length != null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FDEBEC] text-[#D92228] border border-[#F5C2C4] whitespace-nowrap">
                      <Filter className="w-2.5 h-2.5" />
                      {sortedMessages.length} / {activeData.messages.length} messages
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Platform Tab Indicator Banner matching reference screenshot */}
            <div className="px-3 sm:px-6 py-1.5 sm:py-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between gap-2 text-xs flex-shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#16A34A]" />
                  WhatsApp Cloud API
                </span>
                <span className="text-[11px] text-[#6B7280] hidden sm:inline truncate font-mono">
                  +{activeData.conversation.contact?.wa_id}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[#6B7280] text-[11px] flex-shrink-0">
                <span className="hidden lg:inline">
                  Eureka Jo AI Bot is actively responding to inquiries.
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
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-3 bg-white overscroll-contain"
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
                        searchQuery={inChatSearch}
                        isFocusedResult={
                          matchingMessageIds.length > 0 &&
                          matchingMessageIds[activeMatchIndex] === msg.id
                        }
                        onImageClick={(url) => setSelectedImage(url)}
                      />
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Read-Only Status Bar matching reference screenshot */}
            <div className="p-2.5 sm:p-3 bg-[#F9FAFB] border-t border-[#E5E7EB] text-center text-[11px] sm:text-xs text-[#6B7280] flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D92228] flex-shrink-0" />
              <span>
                Read-only mode. Automated replies processed in real-time by Eureka Jo Bot.
              </span>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="font-semibold text-[#D92228] hover:underline cursor-pointer ml-0.5"
              >
                View Contact CRM
              </button>
            </div>
          </>
        ) : selectedId || loadingThread ? (
          /* Loading Skeleton View for Selected Conversation */
          <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] animate-in fade-in duration-150">
            {/* Top Contact Header Bar Skeleton */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[#E5E7EB] bg-white shadow-xs z-10 flex-shrink-0">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {mobileView === 'chat' && (
                    <button
                      type="button"
                      onClick={() => setMobileView('list')}
                      className="p-1.5 -ml-1 rounded-xl text-[#1A1A1A] hover:bg-[#FDEBEC] hover:text-[#D92228] transition-colors md:hidden cursor-pointer flex-shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FDEBEC] text-[#D92228] font-bold text-xs sm:text-sm flex items-center justify-center border border-[#F5C2C4] shadow-xs flex-shrink-0">
                    {loadingConversation?.contact?.profile_name?.[0]?.toUpperCase() || 'W'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-[#1A1A1A] truncate">
                      {loadingConversation?.contact?.profile_name || 'Loading Conversation...'}
                    </h2>
                    <p className="text-[10px] text-[#6B7280] font-mono truncate">
                      {loadingConversation?.contact?.wa_id ? `+${loadingConversation.contact.wa_id}` : 'Connecting...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDEBEC] text-[#D92228] text-xs font-semibold border border-[#F5C2C4]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D92228]" />
                    <span className="hidden sm:inline">Loading chat...</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Body Loader & Shimmer Bubbles */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center items-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center border border-[#F5C2C4] shadow-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#D92228]" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-[#1A1A1A]">Loading Conversation...</h4>
                <p className="text-xs text-[#6B7280]">Fetching messages from WhatsApp Cloud API</p>
              </div>

              {/* Decorative Shimmer Bubbles */}
              <div className="w-full max-w-md space-y-3 pt-2 opacity-60 pointer-events-none">
                <div className="flex justify-start">
                  <div className="w-48 sm:w-60 h-10 rounded-2xl rounded-tl-xs bg-gray-200 animate-pulse" />
                </div>
                <div className="flex justify-end">
                  <div className="w-56 sm:w-68 h-12 rounded-2xl rounded-tr-xs bg-[#F5C2C4]/40 animate-pulse" />
                </div>
                <div className="flex justify-start">
                  <div className="w-40 sm:w-52 h-9 rounded-2xl rounded-tl-xs bg-gray-200 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State when no conversation is selected */
          <div className="flex-1 flex flex-col items-center justify-center text-[#6B7280] p-6 text-center">
            {mobileView === 'chat' && (
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDEBEC] text-[#D92228] text-xs font-semibold md:hidden cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Conversations</span>
              </button>
            )}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center mb-4 border border-[#F5C2C4]">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Select a Conversation</h3>
            <p className="text-xs text-[#6B7280] mt-1 text-center max-w-sm">
              Choose an active thread from the inbox to review the live dialogue between the customer and Eureka Jo Bot.
            </p>
          </div>
        )}
      </div>

      {/* COLUMN 4: Far-Right CRM Customer 360 Drawer */}
      {showDetails && activeData && (
        <ContactDetailsDrawer
          conversation={activeData.conversation}
          totalMessages={activeData.messages.length}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Delete Confirmation Popup Modal */}
      {showDeleteModal && activeData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center flex-shrink-0 border border-[#F5C2C4]">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1A1A1A]">
                  Delete Conversation?
                </h3>
                <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
                  Are you sure you want to remove the conversation with{' '}
                  <span className="font-semibold text-[#1A1A1A]">
                    {activeData.conversation.contact?.profile_name || 'this contact'}
                  </span>{' '}
                  from your inbox view?
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] text-[#6B7280]">
                  <span className="font-semibold text-[#1A1A1A]">🔒 Database Safe:</span> All messages and historical records remain safely preserved in Supabase. This chat is only hidden from the inbox across all devices and users.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D92228] hover:bg-[#B71C21] text-white transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
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
