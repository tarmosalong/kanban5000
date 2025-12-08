import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const q = searchParams.get('q') || '';

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const res = await fetch(
    `${BACKEND_URL}/api/projects/${projectId}/issues/search?q=${encodeURIComponent(q)}`,
    {
      headers: {
        Authorization: `Bearer ${session.backendToken}`,
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

