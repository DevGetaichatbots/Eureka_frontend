import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = `http://localhost:8000/api/conversations?${searchParams.toString()}`;
    const res = await fetch(backendUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error('Error proxying conversations to FastAPI:', err);
  }
  return NextResponse.json({ items: [], total: 0, page: 1, limit: 50, total_pages: 1 });
}
