import Link from 'next/link';

import { api } from '@/lib/api';
import { Button } from '@/components/ui';

// Get characteristic icon and colors for workspace
function getWorkspaceStyle(slug: string, name: string): { icon: React.ReactNode; gradient: string; iconBg: string } {
  const lowerName = name.toLowerCase();
  const lowerSlug = slug.toLowerCase();
  
  // Engineering/Tech workspaces
  if (lowerSlug.includes('acme') || lowerName.includes('engineering') || lowerName.includes('corporation')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: 'from-blue-500/10 to-blue-600/5',
      iconBg: 'bg-blue-500/10',
    };
  }
  
  // Open Source workspaces
  if (lowerSlug.includes('open-source') || lowerName.includes('open source') || lowerName.includes('community')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      iconBg: 'bg-emerald-500/10',
    };
  }
  
  // Marketing workspaces
  if (lowerSlug.includes('marketing') || lowerName.includes('marketing') || lowerName.includes('campaign')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      gradient: 'from-pink-500/10 to-pink-600/5',
      iconBg: 'bg-pink-500/10',
    };
  }
  
  // Design workspaces
  if (lowerSlug.includes('design') || lowerName.includes('design') || lowerName.includes('creative')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      gradient: 'from-violet-500/10 to-violet-600/5',
      iconBg: 'bg-violet-500/10',
    };
  }
  
  // Default - folder icon
  return {
    icon: (
      <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    gradient: 'from-accent-500/10 to-accent-600/5',
    iconBg: 'bg-accent-500/10',
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
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Workspaces</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Manage your workspaces and projects
          </p>
        </div>
        <Link href="/workspaces/new">
          <Button size="sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New workspace
          </Button>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && workspaces.length === 0 && (
        <div className="text-center py-20 px-4 rounded-xl border border-white/[0.04] bg-zinc-900/30">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-medium text-white mb-2">No workspaces yet</h3>
          <p className="text-[13px] text-zinc-500 mb-6 max-w-sm mx-auto">
            Create your first workspace to start organizing your projects
          </p>
          <Link href="/workspaces/new">
            <Button>Create workspace</Button>
          </Link>
        </div>
      )}

      {/* Workspace list */}
      {workspaces.length > 0 && (
        <div className="space-y-2">
          {workspaces.map((workspace, index) => {
            const style = getWorkspaceStyle(workspace.slug, workspace.name);
            return (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/[0.08] transition-all duration-150 animate-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[14px] text-white group-hover:text-accent-400 transition-colors truncate">
                      {workspace.name}
                    </h3>
                    <span className="text-[11px] text-zinc-700 font-mono">/{workspace.slug}</span>
                  </div>
                  {workspace.description && (
                    <p className="mt-0.5 text-[12px] text-zinc-600 truncate">
                      {workspace.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[12px] text-zinc-600">
                  <span>
                    {new Date(workspace.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
