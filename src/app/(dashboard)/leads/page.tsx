'use client';

import React, { useEffect, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Contact } from '@/types';
import { api } from '@/lib/api';
import { LeadsSummaryCards } from '@/components/leads/LeadsSummaryCards';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { PaginationBar } from '@/components/conversations/PaginationBar';
import { formatKarachiDateTime, formatPhone, isWithin24Hours } from '@/lib/utils';
import {
  Users,
  Search,
  FileSpreadsheet,
  FileText,
  X,
  RefreshCw,
  Loader2,
  Calendar,
  Filter,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

// Helper to get YYYY-MM-DD in Asia/Karachi (matching the display timezone)
const getKarachiDateStr = (dateObj: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  } catch {
    return dateObj.toISOString().split('T')[0];
  }
};

// Helper to extract YYYY-MM-DD key from an ISO timestamp
const getContactDateKey = (isoStr: string | null | undefined): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
};

export default function LeadsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'>('all');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deleted leads sync with localStorage & cross-tab / cross-component events
  const [deletedLeadKeys, setDeletedLeadKeys] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eureka_deleted_lead_wa_ids');
        const savedChats = localStorage.getItem('eureka_deleted_chats');
        const set = new Set<string>();
        if (saved) JSON.parse(saved).forEach((k: any) => set.add(String(k)));
        if (savedChats) JSON.parse(savedChats).forEach((k: any) => set.add(String(k)));
        return set;
      } catch {}
    }
    return new Set<string>();
  });

  const [deletedCutoffs, setDeletedCutoffs] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('eureka_deleted_cutoffs');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });

  useEffect(() => {
    const syncDeleted = () => {
      try {
        const saved = localStorage.getItem('eureka_deleted_lead_wa_ids');
        const savedChats = localStorage.getItem('eureka_deleted_chats');
        const set = new Set<string>();
        if (saved) JSON.parse(saved).forEach((k: any) => set.add(String(k)));
        if (savedChats) JSON.parse(savedChats).forEach((k: any) => set.add(String(k)));
        setDeletedLeadKeys(set);
        const savedCutoffs = localStorage.getItem('eureka_deleted_cutoffs');
        if (savedCutoffs) setDeletedCutoffs(JSON.parse(savedCutoffs));
      } catch {}
    };

    window.addEventListener('storage', syncDeleted);
    window.addEventListener('eureka_deleted_updated', syncDeleted);
    syncDeleted();
    return () => {
      window.removeEventListener('storage', syncDeleted);
      window.removeEventListener('eureka_deleted_updated', syncDeleted);
    };
  }, []);

  const handleDeleteLead = async (contact: Contact) => {
    const rawWa = contact.wa_id || '';
    const digits = rawWa.replace(/\D/g, '');
    const idStr = String(contact.id || '');
    const nowIso = new Date().toISOString();

    setDeletedCutoffs((prev) => {
      const next = { ...prev };
      if (idStr) next[idStr] = nowIso;
      if (rawWa) next[rawWa] = nowIso;
      if (digits) {
        next[digits] = nowIso;
        next[`+${digits}`] = nowIso;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('eureka_deleted_cutoffs', JSON.stringify(next));
      }
      return next;
    });

    setDeletedLeadKeys((prev) => {
      const next = new Set(prev);
      if (rawWa) next.add(rawWa);
      if (digits) next.add(digits);
      if (rawWa) next.add(`+${digits}`);
      if (idStr) next.add(idStr);

      if (typeof window !== 'undefined') {
        localStorage.setItem('eureka_deleted_lead_wa_ids', JSON.stringify(Array.from(next)));
        window.dispatchEvent(new Event('eureka_deleted_updated'));
      }
      return next;
    });

    try {
      await api.deleteConversation(contact.id, {
        contact_id: contact.id,
        wa_id: contact.wa_id,
        deleted_by_user: 'admin@eurekajo.com',
      });
    } catch (err) {
      console.error('Failed to record deleted lead in Supabase:', err);
    }
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await api.getLeads(1, 500);
      const rawList = (res as any)?.items || (res as any)?.leads || [];
      const safeList = Array.isArray(rawList) ? rawList : [];
      setContacts(safeList);

      // If server returns active verified leads, un-suppress any revived leads in UI
      if (safeList.length > 0) {
        setDeletedLeadKeys((prev) => {
          let changed = false;
          const next = new Set(prev);
          safeList.forEach((c) => {
            const rawWa = c.wa_id || '';
            const digits = rawWa.replace(/\D/g, '');
            const idStr = String(c.id || '');
            if (next.has(rawWa)) { next.delete(rawWa); changed = true; }
            if (digits && next.has(digits)) { next.delete(digits); changed = true; }
            if (next.has(`+${digits}`)) { next.delete(`+${digits}`); changed = true; }
            if (next.has(idStr)) { next.delete(idStr); changed = true; }
          });
          if (changed && typeof window !== 'undefined') {
            localStorage.setItem('eureka_deleted_lead_wa_ids', JSON.stringify(Array.from(next)));
          }
          return changed ? next : prev;
        });
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
      setContacts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeads();
    // Poller to update leads in real-time
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadLeads();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeads();
  };

  // Contacts excluding deleted ones unless they have new activity after deletion
  const visibleContacts = useMemo(() => {
    const safeList = contacts || [];
    return safeList.filter((c) => {
      const rawWa = c.wa_id || '';
      const waDigits = rawWa.replace(/\D/g, '');
      const plusWa = rawWa.startsWith('+') ? rawWa : `+${rawWa}`;
      const idStr = String(c.id || '');
      const contactIdStr = String((c as any).contact_id || '');

      const cutoffIso =
        (idStr && deletedCutoffs[idStr]) ||
        (contactIdStr && deletedCutoffs[contactIdStr]) ||
        (rawWa && deletedCutoffs[rawWa]) ||
        (waDigits && deletedCutoffs[waDigits]) ||
        (plusWa && deletedCutoffs[plusWa]);

      if (cutoffIso) {
        const cutoffTime = new Date(cutoffIso).getTime();
        const lastSeenTime = new Date(c.last_seen_at || c.first_seen_at).getTime();
        // If contact has sent a new message since deletion, show them updated!
        if (lastSeenTime <= cutoffTime) {
          return false;
        }
      } else if (
        deletedLeadKeys.has(rawWa) ||
        (waDigits && deletedLeadKeys.has(waDigits)) ||
        deletedLeadKeys.has(plusWa) ||
        deletedLeadKeys.has(idStr) ||
        deletedLeadKeys.has(contactIdStr)
      ) {
        return false;
      }
      return true;
    });
  }, [contacts, deletedLeadKeys, deletedCutoffs]);

  // Date Preset handler
  const handlePresetSelect = (preset: 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'month') => {
    setDatePreset(preset);
    const todayStr = getKarachiDateStr(new Date());

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yStr = getKarachiDateStr(yesterday);
      setFromDate(yStr);
      setToDate(yStr);
    } else if (preset === '7days') {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      setFromDate(getKarachiDateStr(past));
      setToDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      setFromDate(getKarachiDateStr(past));
      setToDate(todayStr);
    } else if (preset === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(getKarachiDateStr(firstDay));
      setToDate(todayStr);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setDatePreset('all');
    setPage(1);
  };

  // Accurate date matching helper using YYYY-MM-DD day keys
  const isLeadInDateRange = (contact: Contact, from: string, to: string) => {
    if (!from && !to) return true;

    // Normalizing order if from > to
    const effectiveFrom = from && to && from > to ? to : from;
    const effectiveTo = from && to && from > to ? from : to;

    const lastKey = getContactDateKey(contact.last_seen_at);
    const firstKey = getContactDateKey(contact.first_seen_at);

    const isKeyInRange = (key: string) => {
      if (!key) return false;
      if (effectiveFrom && key < effectiveFrom) return false;
      if (effectiveTo && key > effectiveTo) return false;
      return true;
    };

    // A lead matches if their last activity OR first contact date is within the selected range
    return (lastKey ? isKeyInRange(lastKey) : false) || (firstKey ? isKeyInRange(firstKey) : false);
  };

  // Search & Date filtering applied together
  const filteredContacts = useMemo(() => {
    const safeList = visibleContacts || [];
    let list = safeList;

    // 1. Date filter
    if (fromDate || toDate) {
      list = list.filter((c) => isLeadInDateRange(c, fromDate, toDate));
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const digits = q.replace(/\D/g, '');

      list = list.filter((c) => {
        const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
        const phoneMatch = digits.length >= 3 && c.wa_id.includes(digits);
        return nameMatch || phoneMatch;
      });
    }

    return list;
  }, [visibleContacts, searchQuery, fromDate, toDate]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, fromDate, toDate, datePreset]);

  // Total pages calculation
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));

  // Ensure current page does not exceed total pages
  const validPage = Math.min(page, totalPages);

  // Paginated contacts to display on the current page
  const paginatedContacts = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return filteredContacts.slice(startIndex, startIndex + pageSize);
  }, [filteredContacts, validPage, pageSize]);

  // Metrics based on filtered contacts
  const activeLeadsCount = useMemo(() => {
    return filteredContacts.filter((c) => isWithin24Hours(c.last_seen_at)).length;
  }, [filteredContacts]);

  const totalMessagesCount = useMemo(() => {
    return filteredContacts.reduce((sum, c) => sum + (c.message_count || 0), 0);
  }, [filteredContacts]);

  // Helper to show temporary export success banner
  const triggerSuccessMsg = (msg: string) => {
    setExportSuccessMsg(msg);
    setTimeout(() => setExportSuccessMsg(null), 5000);
  };

  // Download handlers (exports all matching filtered contacts, not just the single page)
  const handleExportCsv = () => {
    if (filteredContacts.length === 0) {
      alert('No lead records match your selected date filter or search query.');
      return;
    }

    setExportingCsv(true);
    try {
      const header = [
        'WhatsApp Phone Number',
        'Raw WA ID',
        'Profile Name',
        'First Contact Date & Time (PKT)',
        'Last Activity Date & Time (PKT)',
        'Total Messages',
        '24h Window Status',
      ];

      const rows = filteredContacts.map((c) => [
        `"${formatPhone(c.wa_id)}"`,
        `"${c.wa_id}"`,
        `"${(c.profile_name || 'WhatsApp User').replace(/"/g, '""')}"`,
        `"${formatKarachiDateTime(c.first_seen_at)}"`,
        `"${formatKarachiDateTime(c.last_seen_at)}"`,
        c.message_count || 0,
        `"${isWithin24Hours(c.last_seen_at) ? 'Active Window' : 'Past 24h Window'}"`,
      ]);

      const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      let fileLabel = 'all_time';
      if (fromDate && toDate) fileLabel = `${fromDate}_to_${toDate}`;
      else if (fromDate) fileLabel = `from_${fromDate}`;
      else if (toDate) fileLabel = `up_to_${toDate}`;
      else {
        fileLabel = getKarachiDateStr(new Date());
      }

      a.download = `eureka_leads_${fileLabel}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      triggerSuccessMsg(`Successfully exported ${filteredContacts.length} lead(s) to CSV`);
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportXlsx = () => {
    if (filteredContacts.length === 0) {
      alert('No lead records match your selected date filter or search query.');
      return;
    }

    setExportingXlsx(true);
    try {
      const data = filteredContacts.map((c) => {
        const active = isWithin24Hours(c.last_seen_at);
        return {
          'WhatsApp Phone Number': formatPhone(c.wa_id),
          'Raw WA ID': c.wa_id,
          'Profile Name': c.profile_name || 'WhatsApp User',
          'First Contact Date & Time (PKT)': formatKarachiDateTime(c.first_seen_at),
          'Last Activity Date & Time (PKT)': formatKarachiDateTime(c.last_seen_at),
          'Total Messages': c.message_count || 0,
          'Status': active ? 'Active Window (Hot Lead)' : 'Past 24h Window',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto column widths for clean readability in Excel
      worksheet['!cols'] = [
        { wch: 22 }, // WhatsApp Phone Number
        { wch: 18 }, // Raw WA ID
        { wch: 24 }, // Profile Name
        { wch: 28 }, // First Contact Date & Time
        { wch: 28 }, // Last Activity Date & Time
        { wch: 16 }, // Total Messages
        { wch: 26 }, // Status
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'WhatsApp Leads');

      const buf = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      let fileLabel = 'all_time';
      if (fromDate && toDate) fileLabel = `${fromDate}_to_${toDate}`;
      else if (fromDate) fileLabel = `from_${fromDate}`;
      else if (toDate) fileLabel = `up_to_${toDate}`;
      else {
        fileLabel = getKarachiDateStr(new Date());
      }

      a.download = `eureka_leads_${fileLabel}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      triggerSuccessMsg(`Successfully exported ${filteredContacts.length} lead(s) to Excel (.xlsx)`);
    } catch (err) {
      console.error('XLSX export failed:', err);
      alert('Failed to export Excel spreadsheet. Please try again.');
    } finally {
      setExportingXlsx(false);
    }
  };

  const isFiltered = Boolean(searchQuery.trim() || fromDate || toDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1A1A1A] dark:text-[#F3F4F6] leading-none">
                Leads CRM & Contacts
              </h1>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                Unique Eureka Jo customer contacts acquired via WhatsApp bot · Export for CRM
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#D92228] dark:hover:text-white bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 text-[#D92228] ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv || loading || filteredContacts.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9FAFB] dark:hover:bg-[#202c33] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            title={filteredContacts.length > 0 ? `Export ${filteredContacts.length} lead(s) to CSV` : 'No leads to export'}
          >
            {exportingCsv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D92228]" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span>Export CSV</span>
            {filteredContacts.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-600 font-mono font-semibold">
                {filteredContacts.length}
              </span>
            )}
          </button>

          {/* Export XLSX Button */}
          <button
            onClick={handleExportXlsx}
            disabled={exportingXlsx || loading || filteredContacts.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#D92228] hover:bg-[#B71C21] text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            title={filteredContacts.length > 0 ? `Export ${filteredContacts.length} lead(s) to Excel (.xlsx)` : 'No leads to export'}
          >
            {exportingXlsx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>Export Excel (.xlsx)</span>
            {filteredContacts.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono font-semibold">
                {filteredContacts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Export Success Notification Toast */}
      {exportSuccessMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <LeadsSummaryCards
        totalLeads={filteredContacts.length}
        activeLeads={activeLeadsCount}
        totalMessages={totalMessagesCount}
      />

      {/* Search & Date Filter Bar */}
      <div className="bg-white dark:bg-[#162026] p-4 rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs space-y-3.5">
        {/* Row 1: Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by contact name or phone number..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33] text-xs text-[#1A1A1A] dark:text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#D92228] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#D92228] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Date Filters & Preset Buttons */}
        <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#26353d] flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Date Range Pickers */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-[#6B7280] dark:text-[#9CA3AF]">
              <Calendar className="w-3.5 h-3.5 text-[#D92228]" />
              <span className="font-semibold">Date Filter:</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mr-1.5">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFromDate(val);
                    setDatePreset('custom');
                  }}
                  className={`py-1 px-2.5 rounded-lg border text-xs text-[#1A1A1A] dark:text-[#F3F4F6] focus:ring-2 focus:ring-[#D92228] focus:outline-none transition-all ${
                    fromDate
                      ? 'border-[#D92228] bg-white dark:bg-[#202c33] font-medium'
                      : 'border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33]'
                  }`}
                />
              </div>

              <div className="relative flex items-center">
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mr-1.5">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setToDate(val);
                    setDatePreset('custom');
                  }}
                  className={`py-1 px-2.5 rounded-lg border text-xs text-[#1A1A1A] dark:text-[#F3F4F6] focus:ring-2 focus:ring-[#D92228] focus:outline-none transition-all ${
                    toDate
                      ? 'border-[#D92228] bg-white dark:bg-[#202c33] font-medium'
                      : 'border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Preset Buttons & Reset */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePresetSelect('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                datePreset === 'all' && !fromDate && !toDate
                  ? 'bg-[#D92228] text-white shadow-xs'
                  : 'bg-[#F9FAFB] dark:bg-[#202c33] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2a3942]'
              }`}
            >
              All Time
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('today')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                datePreset === 'today'
                  ? 'bg-[#D92228] text-white shadow-xs'
                  : 'bg-[#F9FAFB] dark:bg-[#202c33] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2a3942]'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('yesterday')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                datePreset === 'yesterday'
                  ? 'bg-[#D92228] text-white shadow-xs'
                  : 'bg-[#F9FAFB] dark:bg-[#202c33] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2a3942]'
              }`}
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('7days')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                datePreset === '7days'
                  ? 'bg-[#D92228] text-white shadow-xs'
                  : 'bg-[#F9FAFB] dark:bg-[#202c33] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2a3942]'
              }`}
            >
              Last 7 Days
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('30days')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                datePreset === '30days'
                  ? 'bg-[#D92228] text-white shadow-xs'
                  : 'bg-[#F9FAFB] dark:bg-[#202c33] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2a3942]'
              }`}
            >
              Last 30 Days
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('month')}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                datePreset === 'month'
                  ? 'bg-[#D92228] text-white shadow-xs'
                  : 'bg-[#F9FAFB] dark:bg-[#202c33] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#2a3942]'
              }`}
            >
              This Month
            </button>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset All Filters"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-[#D92228] hover:bg-[#FDEBEC] transition-colors ml-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Info Banner */}
        {isFiltered && (
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#6B7280] dark:text-[#9CA3AF] bg-[#FDEBEC]/40 dark:bg-[#D92228]/10 p-2 rounded-xl border border-[#F5C2C4] dark:border-[#D92228]/20">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D92228] animate-pulse" />
              <span>
                Showing <strong className="text-[#1A1A1A] dark:text-[#F3F4F6] font-bold">{filteredContacts.length}</strong> of{' '}
                {visibleContacts.length} leads
                {fromDate && toDate && fromDate === toDate && (
                  <> on date <strong>{fromDate}</strong></>
                )}
                {fromDate && toDate && fromDate !== toDate && (
                  <> from <strong>{fromDate}</strong> to <strong>{toDate}</strong></>
                )}
                {fromDate && !toDate && <> from <strong>{fromDate}</strong> onwards</>}
                {!fromDate && toDate && <> up to <strong>{toDate}</strong></>}
                {searchQuery && <> matching &ldquo;<strong>{searchQuery}</strong>&rdquo;</>}
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[#D92228] hover:underline font-bold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Leads Table Card */}
      <div className="bg-white dark:bg-[#162026] rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs overflow-hidden">
        <LeadsTable
          contacts={paginatedContacts}
          loading={loading}
          searchQuery={searchQuery}
          onDeleteLead={handleDeleteLead}
          onResetFilters={isFiltered ? handleResetFilters : undefined}
        />

        {/* Pagination Bar */}
        <PaginationBar
          page={validPage}
          totalPages={totalPages}
          totalItems={filteredContacts.length}
          limit={pageSize}
          itemName="leads"
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setPageSize(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
