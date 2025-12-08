import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await auth();
  if (!session?.backendToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data } = await api.projects.getStats(params.projectId);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Failed to get project stats:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to get stats' },
      { status: error.status || 500 }
    );
  }
}

