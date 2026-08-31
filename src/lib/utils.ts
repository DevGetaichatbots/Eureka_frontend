/**
 * Formats an ISO UTC timestamp into Asia/Karachi local time.
 */
export function formatKarachiDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formats time only in Asia/Karachi (e.g., 04:30 PM)
 */
export function formatKarachiTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Formats date header divider (e.g. "Today", "Yesterday", or "28 Aug 2026")
 */
export function formatDateDivider(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();

    const karachiDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);

    const todayKarachiStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    if (karachiDateStr === todayKarachiStr) {
      return 'Today';
    }

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format phone number into clean display (e.g., +92 300 1234567)
 */
export function formatPhone(waId: string | null | undefined): string {
  if (!waId) return '—';
  const clean = waId.replace(/\D/g, '');
  if (clean.startsWith('92') && clean.length === 12) {
    return `+92 ${clean.slice(2, 5)} ${clean.slice(5)}`;
  }
  return `+${clean}`;
}

/**
 * Checks if a timestamp is within the 24-hour window
 */
export function isWithin24Hours(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const messageTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    return now - messageTime < twentyFourHoursMs && now >= messageTime;
  } catch {
    return false;
  }
}

