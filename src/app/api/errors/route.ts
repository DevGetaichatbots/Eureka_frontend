import { NextResponse } from 'next/server';
import { MOCK_ERRORS } from '@/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const step = searchParams.get('step')?.trim().toLowerCase();
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));

  let filtered = MOCK_ERRORS;

  if (step && step !== 'all') {
    filtered = filtered.filter((err) => err.step.toLowerCase() === step);
  }

  // Sort newest first
  filtered = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json(filtered.slice(0, limit));
}
