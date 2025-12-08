import Link from 'next/link';
import { notFound } from 'next/navigation';

import { api } from '@/lib/api';
import { Button } from '@/components/ui';

import { DeleteWorkspaceButton } from './delete-button';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceDetailPage({ params }: Props) {
  const { id } = await params;
  
  let workspace: Awaited<ReturnType<typeof api.workspaces.get>> | null = null;
  let error: string | null = null;

  try {
    workspace = await api.workspaces.get(id);
  } catch (e) {
    if (e instanceof Error && e.message.includes('not found')) {
      notFound();
    }
    error = e instanceof Error ? e.message : 'Failed to load workspace';
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!workspace) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
        <Link href="/workspaces" className="hover:text-slate-900 dark:hover:text-white">
          Workspaces
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">{workspace.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{workspace.name}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">/{workspace.slug}</p>
          {workspace.description && (
            <p className="mt-3 text-slate-600 dark:text-slate-300">{workspace.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/workspaces/${workspace.id}/settings`}>
            <Button variant="secondary">Settings</Button>
          </Link>
          <DeleteWorkspaceButton workspaceId={workspace.id} workspaceName={workspace.name} />
        </div>
      </div>

      {/* Content placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Projects</h2>
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-3">📋</div>
              <p>No projects yet</p>
              <p className="text-sm">Projects will be added in the next phase</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Workspace info */}
          <div className="card">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                <dd className="text-slate-900 dark:text-white">
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Updated</dt>
                <dd className="text-slate-900 dark:text-white">
                  {new Date(workspace.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-surface-secondary dark:hover:bg-slate-700">
                ➕ Create project
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-surface-secondary dark:hover:bg-slate-700">
                👥 Invite member
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

