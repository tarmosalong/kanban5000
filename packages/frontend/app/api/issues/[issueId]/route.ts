import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  const session = await auth();
  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/api/issues/${params.issueId}`, {
    headers: {
      Authorization: `Bearer ${session.backendToken}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  const session = await auth();
  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const res = await fetch(`${API_URL}/api/issues/${params.issueId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.backendToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  const session = await auth();
  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/api/issues/${params.issueId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.backendToken}`,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

