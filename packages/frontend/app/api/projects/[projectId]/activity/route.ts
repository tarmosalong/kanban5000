import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  const { projectId } = await params;

  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}/activity`, {
      headers: {
        Authorization: `Bearer ${session.backendToken}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Failed to fetch project activity:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

