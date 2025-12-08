import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;
  
  if (!session?.backendToken) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const response = await fetch(`${BACKEND_URL}/api/workspaces/${id}`, {
    headers: {
      Authorization: `Bearer ${session.backendToken}`,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;
  
  if (!session?.backendToken) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json();

  const response = await fetch(`${BACKEND_URL}/api/workspaces/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.backendToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;
  
  if (!session?.backendToken) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const response = await fetch(`${BACKEND_URL}/api/workspaces/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.backendToken}`,
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

