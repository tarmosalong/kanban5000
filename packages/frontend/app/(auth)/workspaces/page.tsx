import Link from 'next/link';

import { api } from '@/lib/api';
import { Button, ProgressRing } from '@/components/ui';

interface Project {
  id: string;
  name: string;
  slug: string;
  color: string;
  totalIssues?: number;
  closedIssues?: number;
}

// Get characteristic icon and colors for workspace
function getWorkspaceStyle(slug: string, name: string): { icon: React.ReactNode; gradient: string; iconBg: string } {
  const lowerName = name.toLowerCase();
  const lowerSlug = slug.toLowerCase();
  
  // Engineering/Tech/Retail
  if (lowerSlug.includes('bolt') || lowerSlug.includes('starship') || lowerSlug.includes('skeleton')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-accent-500/10 to-accent-600/5',
      iconBg: 'bg-accent-500/10',
    };
  }

  // Banking/Finance
  if (lowerSlug.includes('wise') || lowerSlug.includes('lhv')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      iconBg: 'bg-emerald-500/10',
    };
  }

  // Identity/Auth
  if (lowerSlug.includes('veriff') || lowerSlug.includes('nortal')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      gradient: 'from-blue-500/10 to-blue-600/5',
      iconBg: 'bg-blue-500/10',
    };
  }

  // Energy
  if (lowerSlug.includes('enefit')) {
    return {
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-amber-500/10 to-amber-600/5',
      iconBg: 'bg-amber-500/10',
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
  let workspacesWithProjects: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: string;
    projects: Project[];
  }> = [];
  let error: string | null = null;

  try {
    const workspaces = await api.workspaces.list();
    workspacesWithProjects = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await api.client.get<Project[]>(`/workspaces/${workspace.id}/projects`);
        return {
          ...workspace,
          projects: projects || [],
        };
      })
    );
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
      {!error && workspacesWithProjects.length === 0 && (
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
      {workspacesWithProjects.length > 0 && (
        <div className="space-y-8">
          {workspacesWithProjects.map((workspace, index) => {
            const style = getWorkspaceStyle(workspace.slug, workspace.name);
            return (
              <div 
                key={workspace.id} 
                className="animate-in" 
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Workspace Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <Link
                    href={`/workspaces/${workspace.id}`}
                    className="group flex items-center gap-2.5"
                  >
                    <div className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm border border-white/[0.04]`}>
                      {style.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[15px] text-white group-hover:text-accent-400 transition-colors flex items-center gap-2">
                        {workspace.name}
                        <svg className="w-3.5 h-3.5 text-zinc-600 group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </h3>
                      {workspace.projects.length > 0 && (
                        <p className="text-[11px] text-zinc-600 leading-none mt-0.5">
                          {workspace.projects.length} {workspace.projects.length === 1 ? 'project' : 'projects'}
                        </p>
                      )}
                    </div>
                  </Link>

                  <Link href={`/workspaces/${workspace.id}/projects/new`}>
                    <button className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/[0.05] rounded-md transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </Link>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {workspace.projects.map((project) => {
                    const percentage = project.totalIssues && project.totalIssues > 0 
                      ? Math.round((project.closedIssues || 0) / project.totalIssues * 100) 
                      : 0;

                    return (
                      <Link
                        key={project.id}
                        href={`/workspaces/${workspace.id}/projects/${project.id}`}
                        className="group relative flex flex-col p-4 rounded-xl border border-white/[0.04] bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-accent-500/20 hover:shadow-lg hover:shadow-accent-500/5 transition-all duration-200 overflow-hidden"
                      >
                        {/* Decorative background gradient */}
                        <div 
                          className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                          style={{ backgroundColor: project.color }}
                        />

                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white shadow-md border border-white/10"
                              style={{ 
                                backgroundColor: project.color,
                                boxShadow: `0 4px 12px ${project.color}20`
                              }}
                            >
                              {project.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-[13.5px] text-zinc-200 group-hover:text-white transition-colors truncate">
                                {project.name}
                              </h4>
                              <span className="text-[10px] text-zinc-600 font-mono">/{project.slug}</span>
                            </div>
                          </div>
                          
                          {project.totalIssues && project.totalIssues > 0 ? (
                            <ProgressRing 
                              total={project.totalIssues} 
                              completed={project.closedIssues || 0} 
                              size={32}
                              strokeWidth={3}
                              color={project.color}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full border border-white/[0.04] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            </div>
                          )}
                        </div>

                        <div className="mt-auto flex items-end justify-between">
                          <div className="flex flex-col gap-0.5">
                            {project.totalIssues && project.totalIssues > 0 ? (
                              <>
                                <span className="text-[12px] font-bold text-zinc-300">{percentage}%</span>
                                <span className="text-[10px] text-zinc-600 font-medium">
                                  {project.closedIssues} of {project.totalIssues} done
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-zinc-700 italic">No issues added</span>
                            )}
                          </div>
                          <div className="p-1 rounded bg-white/[0.03] border border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  
                  {workspace.projects.length === 0 && (
                    <Link
                      href={`/workspaces/${workspace.id}/projects/new`}
                      className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-white/[0.04] bg-white/[0.01] text-zinc-700 hover:text-zinc-500 hover:border-white/[0.1] hover:bg-white/[0.02] transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg border border-dashed border-current flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-[12px] font-medium">Add project</span>
                    </Link>
                  )}
                </div>

                {/* Separator between workspaces, except the last one */}
                {index < workspacesWithProjects.length - 1 && (
                  <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
