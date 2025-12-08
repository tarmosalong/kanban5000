import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  const session = await auth();
  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/issues/${params.issueId}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.backendToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Failed to reorder issue:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to reorder issue' },
      { status: 500 }
    );
  }
}

