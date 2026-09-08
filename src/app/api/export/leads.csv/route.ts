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
      contacts = MOCK_CONTACTS;
    }
  } catch (err) {
    console.warn('Error fetching live contacts for CSV export, using fallback:', err);
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

  // Header row
  const header = [
    'WhatsApp Phone Number',
    'Raw WA ID',
    'Profile Name',
    'First Contact Date & Time (PKT)',
    'Last Activity Date & Time (PKT)',
    'Total Messages',
    '24h Window Status',
  ];

  // Rows with Excel-safe formatting (prevents scientific notation on phone numbers)
  const rows = contacts.map((c) => [
    `"${formatPhone(c.wa_id)}"`,
    `"${c.wa_id}"`,
    `"${(c.profile_name || 'WhatsApp User').replace(/"/g, '""')}"`,
    `"${formatKarachiDateTime(c.first_seen_at)}"`,
    `"${formatKarachiDateTime(c.last_seen_at)}"`,
    c.message_count || 0,
    `"${isWithin24Hours(c.last_seen_at) ? 'Active Window' : 'Past 24h Window'}"`,
  ]);

  // Include UTF-8 BOM (\uFEFF) for Excel Windows compatibility
  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  let fileLabel = 'all_time';
  if (fromDate && toDate) fileLabel = `${fromDate}_to_${toDate}`;
  else if (fromDate) fileLabel = `from_${fromDate}`;
  else if (toDate) fileLabel = `up_to_${toDate}`;
  else {
    fileLabel = new Date().toISOString().split('T')[0];
  }

  const filename = `eureka_leads_${fileLabel}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
