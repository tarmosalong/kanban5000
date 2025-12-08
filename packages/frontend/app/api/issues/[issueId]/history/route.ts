import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const session = await auth();
  const { issueId } = await params;

  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/issues/${issueId}/history`, {
      headers: {
        Authorization: `Bearer ${session.backendToken}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
