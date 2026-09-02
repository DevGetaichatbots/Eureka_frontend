import * as XLSX from 'xlsx';
import { formatKarachiDateTime, formatPhone } from '@/lib/utils';
import { Contact } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';

  let contacts: Contact[] = [];

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/leads`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      contacts = data.items || data.leads || [];
    }
  } catch (err) {
    console.error('Error fetching live contacts for XLSX export:', err);
  }

  if (q) {
    const digits = q.replace(/\D/g, '');
    contacts = contacts.filter((c) => {
      const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
      const phoneMatch = digits.length >= 3 && c.wa_id.includes(digits);
      return nameMatch || phoneMatch;
    });
  }

  const data = contacts.map((c) => ({
    'WhatsApp Number': formatPhone(c.wa_id),
    'Raw WA ID': c.wa_id,
    'Profile Name': c.profile_name || 'WhatsApp User',
    'First Contact (PKT)': formatKarachiDateTime(c.first_seen_at),
    'Last Contact (PKT)': formatKarachiDateTime(c.last_seen_at),
    'Total Messages': c.message_count,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for clean appearance in Excel
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'WhatsApp Leads');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const today = new Date().toISOString().split('T')[0];
  const filename = `whatsapp-leads-${today}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
