'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { Contact, Message } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatKarachiDateTime, formatPhone, isWithin24Hours } from '@/lib/utils';
import {
  MessageSquare,
  ChevronRight,
  Flame,
  Clock,
  Calendar,
  FileText,
  FileSpreadsheet,
  Loader2,
  Trash2,
} from 'lucide-react';

interface LeadsTableProps {
  contacts: Contact[];
  loading: boolean;
  searchQuery: string;
  onDeleteLead?: (contact: Contact) => void;
}

export function LeadsTable({ contacts, loading, searchQuery, onDeleteLead }: LeadsTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [downloadingId, setDownloadingId] = useState<{ id: number; type: 'csv' | 'xlsx' } | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Contact | null>(null);

  const fetchLeadMessages = async (contactId: number): Promise<Message[]> => {
    try {
      const res = await api.getConversation(contactId);
      return res?.messages || [];
    } catch (err) {
      console.error(`Failed to fetch messages for contact #${contactId}:`, err);
      return [];
    }
  };

  const handleDownloadSingleCsv = async (contact: Contact) => {
    setDownloadingId({ id: contact.id, type: 'csv' });
    try {
      const messages = await fetchLeadMessages(contact.id);
      const name = contact.profile_name || 'WhatsApp User';
      const phone = formatPhone(contact.wa_id);

      const csvLines: string[] = [];
      csvLines.push('\uFEFF"--- LEAD SUMMARY ---"');
      csvLines.push(`"Profile Name","${name.replace(/"/g, '""')}"`);
      csvLines.push(`"WhatsApp Phone","${phone}"`);
      csvLines.push(`"Raw WA ID","${contact.wa_id}"`);
      csvLines.push(`"First Contact (PKT)","${formatKarachiDateTime(contact.first_seen_at)}"`);
      csvLines.push(`"Last Activity (PKT)","${formatKarachiDateTime(contact.last_seen_at)}"`);
      csvLines.push(`"Total Messages","${contact.message_count || messages.length}"`);
      csvLines.push('');
      csvLines.push('"--- MESSAGE HISTORY ---"');
      csvLines.push('"Message ID","Direction","Date & Time (PKT)","Type","Message Body"');

      messages.forEach((m) => {
        const direction = m.direction === 'customer' ? 'Customer' : 'Eureka Jo Bot';
        const timestamp = formatKarachiDateTime(m.sent_at || m.created_at);
        const body = (m.body || '').replace(/"/g, '""').replace(/\n/g, ' ');
        csvLines.push(`"${m.id}","${direction}","${timestamp}","${m.msg_type || 'text'}","${body}"`);
      });

      const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `lead_${cleanName}_${contact.wa_id}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download single lead CSV:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSingleXlsx = async (contact: Contact) => {
    setDownloadingId({ id: contact.id, type: 'xlsx' });
    try {
      const messages = await fetchLeadMessages(contact.id);
      const name = contact.profile_name || 'WhatsApp User';
      const phone = formatPhone(contact.wa_id);

      const summaryData = [
        { Field: 'Profile Name', Value: name },
        { Field: 'WhatsApp Phone', Value: phone },
        { Field: 'Raw WA ID', Value: contact.wa_id },
        { Field: 'First Contact (PKT)', Value: formatKarachiDateTime(contact.first_seen_at) },
        { Field: 'Last Activity (PKT)', Value: formatKarachiDateTime(contact.last_seen_at) },
        { Field: 'Total Messages', Value: contact.message_count || messages.length },
      ];

      const messagesData = messages.map((m) => ({
        'Message ID': m.id,
        Direction: m.direction === 'customer' ? 'Customer' : 'Eureka Jo Bot',
        'Date & Time (PKT)': formatKarachiDateTime(m.sent_at || m.created_at),
        Type: m.msg_type || 'text',
        'Message Body': m.body || '',
      }));

      const workbook = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 35 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Lead Summary');

      const messagesSheet = XLSX.utils.json_to_sheet(messagesData);
      messagesSheet['!cols'] = [
        { wch: 14 },
        { wch: 16 },
        { wch: 25 },
        { wch: 12 },
        { wch: 60 },
      ];
      XLSX.utils.book_append_sheet(workbook, messagesSheet, 'Message History');

      const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `lead_${cleanName}_${contact.wa_id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download single lead XLSX:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-[#222e35]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-[#202c33]" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-[#202c33] rounded w-1/2" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-28 hidden md:block" />
            <div className="h-4 bg-gray-200 dark:bg-[#202c33] rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#202c33] text-[#8696a0] flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#111b21] dark:text-[#e9edef]">
          No unique leads found
        </h3>
        <p className="text-xs text-[#8696a0] mt-1 max-w-xs mx-auto">
          {searchQuery
            ? `No contacts match "${searchQuery}". Try a different name or phone number.`
            : 'No customer contacts have been recorded yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E5E7EB] dark:border-[#26353d] bg-[#F9FAFB] dark:bg-[#202c33]/40 text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">
            <th className="py-3.5 px-4 sm:px-6">Contact & Phone</th>
            <th className="py-3.5 px-4 hidden md:table-cell">First Contact</th>
            <th className="py-3.5 px-4">Last Activity</th>
            <th className="py-3.5 px-4 text-center">Messages</th>
            <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#26353d] text-xs">
          {contacts.map((contact) => {
            const active = isWithin24Hours(contact.last_seen_at);
            const name = contact.profile_name || 'WhatsApp User';
            const phone = formatPhone(contact.wa_id);
            const isDownloadingCsv = downloadingId?.id === contact.id && downloadingId.type === 'csv';
            const isDownloadingXlsx = downloadingId?.id === contact.id && downloadingId.type === 'xlsx';

            return (
              <tr
                key={contact.id}
                className="hover:bg-[#F9FAFB] dark:hover:bg-[#202c33]/40 transition-colors group"
              >
                {/* Contact & Phone */}
                <td className="py-4 px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FDEBEC] text-[#D92228] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#F5C2C4]">
                      {name[0]?.toUpperCase() || 'W'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1A1A1A] dark:text-[#F3F4F6] group-hover:text-[#D92228] transition-colors">
                        {name}
                      </p>
                      <p className="font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                        {phone}
                      </p>
                    </div>
                  </div>
                </td>

                {/* First Contact Date */}
                <td className="py-4 px-4 hidden md:table-cell text-[#6B7280] dark:text-[#9CA3AF]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D92228]" />
                    <span>{formatKarachiDateTime(contact.first_seen_at)}</span>
                  </div>
                </td>

                {/* Last Activity Date */}
                <td className="py-4 px-4 text-[#1A1A1A]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Clock className="w-3.5 h-3.5 text-[#D92228]" />
                      <span>{formatKarachiDateTime(contact.last_seen_at)}</span>
                    </div>
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Flame className="w-3.5 h-3.5 text-[#16A34A]" />
                        Active Window
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-2 py-0.5 rounded-full">
                        Past 24h
                      </span>
                    )}
                  </div>
                </td>

                {/* Total Messages Count */}
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F9FAFB] border border-[#E5E7EB] text-[#1A1A1A]">
                    <MessageSquare className="w-3.5 h-3.5 text-[#D92228]" />
                    {contact.message_count}
                  </span>
                </td>

                {/* Action Column with Individual Lead Export CSV, Excel & View Chat Buttons */}
                <td className="py-4 px-4 sm:px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Individual CSV Export */}
                    <button
                      onClick={() => handleDownloadSingleCsv(contact)}
                      disabled={downloadingId?.id === contact.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      title={`Download CSV for ${name}`}
                    >
                      {isDownloadingCsv ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      <span>CSV</span>
                    </button>

                    {/* Individual Excel (.xlsx) Export */}
                    <button
                      onClick={() => handleDownloadSingleXlsx(contact)}
                      disabled={downloadingId?.id === contact.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      title={`Download Excel (.xlsx) for ${name}`}
                    >
                      {isDownloadingXlsx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>XLSX</span>
                    </button>

                    {/* View Chat Link */}
                    <Link
                      href={`/conversations/${contact.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] text-[#1A1A1A] hover:bg-[#D92228] hover:text-white hover:border-[#D92228] transition-all shadow-xs cursor-pointer"
                    >
                      <span>View Chat</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Delete Lead Button (Administrator Only) */}
                    {isAdmin && onDeleteLead && (
                      <button
                        type="button"
                        onClick={() => setLeadToDelete(contact)}
                        className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#D92228] hover:bg-[#FDEBEC] transition-all cursor-pointer"
                        title={`Delete lead for ${name}`}
                      >
                        <Trash2 className="w-4 h-4 text-[#D92228]" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Delete Lead Confirmation Popup Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FDEBEC] text-[#D92228] flex items-center justify-center flex-shrink-0 border border-[#F5C2C4]">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1A1A1A]">
                  Delete Lead Contact?
                </h3>
                <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
                  Are you sure you want to remove{' '}
                  <span className="font-semibold text-[#1A1A1A]">
                    {leadToDelete.profile_name || 'this contact'}
                  </span>{' '}
                  ({formatPhone(leadToDelete.wa_id)}) from your Leads view?
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-[11px] text-[#6B7280]">
                  <span className="font-semibold text-[#1A1A1A]">🔒 Database Safe:</span> All messages and historical logs remain securely preserved in your Supabase database.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLead?.(leadToDelete);
                  setLeadToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D92228] hover:bg-[#B71C21] text-white transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
