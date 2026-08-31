import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const backendUrl = `http://localhost:8000/api/conversations/${id}`;
    const res = await fetch(backendUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.error(`Error proxying conversation ${id} to FastAPI:`, err);
  }
  return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
}
