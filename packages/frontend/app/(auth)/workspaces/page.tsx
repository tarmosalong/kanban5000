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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="mt-1 text-slate-400">
            Manage your workspaces and projects
          </p>
        </div>
        <Link href="/workspaces/new">
          <Button>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Workspace
          </Button>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && workspaces.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No workspaces yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Create your first workspace to get started organizing your projects
          </p>
          <Link href="/workspaces/new">
            <Button>Create Workspace</Button>
          </Link>
        </div>
      )}

      {/* Workspace grid */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspaces.map((workspace, index) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="group card-hover animate-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/30 flex items-center justify-center text-2xl shadow-lg">
                  🗂️
                </div>
              </div>
              <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                {workspace.name}
              </h3>
              <p className="text-sm text-slate-500">/{workspace.slug}</p>
              {workspace.description && (
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                  {workspace.description}
                </p>
              )}
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-500">
                <span>
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </span>
                <span className="text-slate-400 group-hover:text-primary-400 transition-colors">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
