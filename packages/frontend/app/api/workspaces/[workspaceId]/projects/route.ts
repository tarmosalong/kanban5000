import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url = `${API_URL}/api/workspaces/${params.workspaceId}/projects${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const url = `${API_URL}/api/workspaces/${params.workspaceId}/projects`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

