'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Contact } from '@/types';
import { api } from '@/lib/api';
import { LeadsSummaryCards } from '@/components/leads/LeadsSummaryCards';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { PaginationBar } from '@/components/conversations/PaginationBar';
import { isWithin24Hours } from '@/lib/utils';
import {
  Users,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function LeadsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadLeads = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.getLeads(pageNum, 50);
      const rawList = (res as any)?.items || (res as any)?.leads || [];
      const safeList = Array.isArray(rawList) ? rawList : [];
      setContacts(safeList);
      setPage(res.page || 1);
      setTotalPages(res.total_pages || 1);
      setTotalItems((res as any)?.total || (res as any)?.total_leads || safeList.length);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setContacts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeads(page);
  }, [page]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeads(page);
  };

  // Client-side search filtering
  const filteredContacts = useMemo(() => {
    const safeList = contacts || [];
    if (!searchQuery) return safeList;
    const q = searchQuery.toLowerCase().trim();
    const digits = q.replace(/\D/g, '');

    return safeList.filter((c) => {
      const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
      const phoneMatch = digits.length >= 3 && c.wa_id.includes(digits);
      return nameMatch || phoneMatch;
    });
  }, [contacts, searchQuery]);

  // Metrics
  const activeLeadsCount = useMemo(() => {
    const safeList = contacts || [];
    return safeList.filter((c) => isWithin24Hours(c.last_seen_at)).length;
  }, [contacts]);

  const totalMessagesCount = useMemo(() => {
    const safeList = contacts || [];
    return safeList.reduce((sum, c) => sum + (c.message_count || 0), 0);
  }, [contacts]);

  // Download handlers
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const qParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/export/leads.csv${qParam}`);
      if (!response.ok) throw new Error('Failed to export CSV');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `whatsapp-leads-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportXlsx = async () => {
    setExportingXlsx(true);
    try {
      const qParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/export/leads.xlsx${qParam}`);
      if (!response.ok) throw new Error('Failed to export Excel spreadsheet');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `whatsapp-leads-${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('XLSX export failed:', err);
    } finally {
      setExportingXlsx(false);
    }
  };

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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl text-[#6B7280] hover:text-[#D92228] dark:hover:text-white bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 text-[#D92228] ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv || loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#162026] border border-[#E5E7EB] dark:border-[#26353d] text-[#1A1A1A] dark:text-[#F3F4F6] hover:bg-[#F9FAFB] dark:hover:bg-[#202c33] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {exportingCsv ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D92228]" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span>Export CSV</span>
          </button>

          {/* Export XLSX Button */}
          <button
            onClick={handleExportXlsx}
            disabled={exportingXlsx || loading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#D92228] hover:bg-[#B71C21] text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {exportingXlsx ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <LeadsSummaryCards
        totalLeads={contacts.length}
        activeLeads={activeLeadsCount}
        totalMessages={totalMessagesCount}
      />

      {/* Search Filter Bar */}
      <div className="bg-white dark:bg-[#162026] p-3 sm:p-4 rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs">
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
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#D92228]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Leads Table Card */}
      <div className="bg-white dark:bg-[#162026] rounded-2xl border border-[#E5E7EB] dark:border-[#26353d] shadow-xs overflow-hidden">
        <LeadsTable
          contacts={filteredContacts}
          loading={loading}
          searchQuery={searchQuery}
        />

        {/* Pagination Bar */}
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={50}
          itemName="leads"
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>
  );
}
