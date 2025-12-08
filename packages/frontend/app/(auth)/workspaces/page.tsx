import Link from 'next/link';

import { api } from '@/lib/api';
import { Button } from '@/components/ui';

export default async function WorkspacesPage() {
  let workspaces: Awaited<ReturnType<typeof api.workspaces.list>> = [];
  let error: string | null = null;

  try {
    workspaces = await api.workspaces.list();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load workspaces';
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspaces</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage your workspaces and projects
          </p>
        </div>
        <Link href="/workspaces/new">
          <Button>Create Workspace</Button>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && workspaces.length === 0 && (
        <div className="text-center py-12 card">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No workspaces yet</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Create your first workspace to get started
          </p>
          <Link href="/workspaces/new" className="mt-4 inline-block">
            <Button>Create Workspace</Button>
          </Link>
        </div>
      )}

      {/* Workspace grid */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="card hover:shadow-md hover:border-primary-200 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">/{workspace.slug}</p>
                </div>
                <div className="text-2xl">🗂️</div>
              </div>
              {workspace.description && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {workspace.description}
                </p>
              )}
              <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

