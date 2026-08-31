import { MOCK_CONTACTS } from '@/lib/mockData';
import { formatKarachiDateTime, formatPhone } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';

  let contacts = MOCK_CONTACTS;
  if (q) {
    const digits = q.replace(/\D/g, '');
    contacts = contacts.filter((c) => {
      const nameMatch = c.profile_name?.toLowerCase().includes(q) ?? false;
      const phoneMatch = digits.length >= 3 && c.wa_id.includes(digits);
      return nameMatch || phoneMatch;
    });
  }

  // Header row
  const header = ['WhatsApp Phone Number', 'Profile Name', 'First Seen (Karachi PKT)', 'Last Seen (Karachi PKT)', 'Total Messages'];

  // Rows with Excel-safe formatting (prevents scientific notation on phone numbers)
  const rows = contacts.map((c) => [
    `"${formatPhone(c.wa_id)}"`,
    `"${(c.profile_name || 'WhatsApp User').replace(/"/g, '""')}"`,
    `"${formatKarachiDateTime(c.first_seen_at)}"`,
    `"${formatKarachiDateTime(c.last_seen_at)}"`,
    c.message_count,
  ]);

  // Include UTF-8 BOM (\uFEFF) for Excel Windows compatibility
  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = `whatsapp-leads-${today}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
