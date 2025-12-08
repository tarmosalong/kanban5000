import Link from 'next/link';

import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { WorkspaceStatsSection } from './workspace-stats-section';

// Get characteristic icon and colors for workspace
function getWorkspaceStyle(slug: string, name: string): { icon: React.ReactNode; gradient: string } {
  const lowerName = name.toLowerCase();
  const lowerSlug = slug.toLowerCase();
  
  // Engineering/Tech workspaces
  if (lowerSlug.includes('acme') || lowerName.includes('engineering') || lowerName.includes('corporation')) {
    return {
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: 'from-blue-500/20 to-indigo-600/30',
    };
  }
  
  // Open Source workspaces
  if (lowerSlug.includes('open-source') || lowerName.includes('open source') || lowerName.includes('community')) {
    return {
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      gradient: 'from-emerald-500/20 to-teal-600/30',
    };
  }
  
  // Marketing workspaces
  if (lowerSlug.includes('marketing') || lowerName.includes('marketing') || lowerName.includes('campaign')) {
    return {
      icon: (
        <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      gradient: 'from-pink-500/20 to-rose-600/30',
    };
  }
  
  // Design workspaces
  if (lowerSlug.includes('design') || lowerName.includes('design') || lowerName.includes('creative')) {
    return {
      icon: (
        <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      gradient: 'from-violet-500/20 to-purple-600/30',
    };
  }
  
  // Default - folder icon
  return {
    icon: (
      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    gradient: 'from-primary-500/20 to-primary-600/30',
  };
}

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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {workspaces.map((workspace, index) => {
              const style = getWorkspaceStyle(workspace.slug, workspace.name);
              return (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className="group card-hover animate-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg`}>
                    {style.icon}
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
            );
            })}
          </div>

          {/* Statistics Section */}
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            <WorkspaceStatsSection workspaces={workspaces.map(w => ({ id: w.id, name: w.name }))} />
          </div>
        </>
      )}
    </div>
  );
}
