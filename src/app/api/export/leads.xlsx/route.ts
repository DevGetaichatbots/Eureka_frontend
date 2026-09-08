import * as XLSX from 'xlsx';
import { formatKarachiDateTime, formatPhone, isWithin24Hours } from '@/lib/utils';
import { Contact } from '@/types';
import { MOCK_CONTACTS } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';
  const fromDate = searchParams.get('from')?.trim() || '';
  const toDate = searchParams.get('to')?.trim() || '';

  let contacts: Contact[] = [];

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${backendUrl}/api/leads`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      contacts = data.items || data.leads || [];
    } else {
      // Fallback
      contacts = MOCK_CONTACTS;
    }
  } catch (err) {
    console.warn('Error fetching live contacts for XLSX export, using fallback:', err);
    contacts = MOCK_CONTACTS;
  }

  // 1. Filter by search query
  if (q) {
    const digits = q.replace(/\D/g, '');
    contacts = contacts.filter((c) => {
      const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
      const phoneMatch = digits.length >= 3 && c.wa_id.includes(digits);
      return nameMatch || phoneMatch;
    });
  }

  // 2. Filter by date range (from / to)
  if (fromDate || toDate) {
    contacts = contacts.filter((c) => {
      const dateToTest = c.last_seen_at || c.first_seen_at;
      if (!dateToTest) return false;
      const leadTime = new Date(dateToTest).getTime();
      if (isNaN(leadTime)) return false;

      if (fromDate) {
        const fromTime = new Date(`${fromDate}T00:00:00`).getTime();
        if (leadTime < fromTime) return false;
      }
      if (toDate) {
        const toTime = new Date(`${toDate}T23:59:59.999`).getTime();
        if (leadTime > toTime) return false;
      }
      return true;
    });
  }

  const data = contacts.map((c) => {
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

  // Set column widths for clean appearance in Excel
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 28 },
    { wch: 28 },
    { wch: 16 },
    { wch: 26 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'WhatsApp Leads');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  let fileLabel = 'all_time';
  if (fromDate && toDate) fileLabel = `${fromDate}_to_${toDate}`;
  else if (fromDate) fileLabel = `from_${fromDate}`;
  else if (toDate) fileLabel = `up_to_${toDate}`;
  else {
    fileLabel = new Date().toISOString().split('T')[0];
  }

  const filename = `eureka_leads_${fileLabel}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
