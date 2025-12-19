import Link from 'next/link';
import { notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { Button, ProgressRing } from '@/components/ui';

import { DeleteWorkspaceButton } from './delete-button';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  isArchived: boolean;
  totalIssues?: number;
  closedIssues?: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

async function getWorkspace(id: string, token: string): Promise<Workspace | null> {
  const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

async function getProjects(workspaceId: string, token: string): Promise<Project[]> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function WorkspaceDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.backendToken) {
    notFound();
  }

  const [workspace, projects] = await Promise.all([
    getWorkspace(id, session.backendToken),
    getProjects(id, session.backendToken),
  ]);

  if (!workspace) {
    notFound();
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <Link href="/workspaces" className="hover:text-white transition-colors">
                Workspaces
              </Link>
              <span>/</span>
              <span className="text-slate-300">{workspace.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{workspace.name}</h1>
            <p className="text-slate-500 text-sm">/{workspace.slug}</p>
            {workspace.description && (
              <p className="mt-3 text-slate-400">{workspace.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/workspaces/${workspace.id}/settings`}>
              <Button variant="secondary" size="sm">Settings</Button>
            </Link>
            <DeleteWorkspaceButton workspaceId={workspace.id} workspaceName={workspace.name} />
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Projects
            <span className="text-sm font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
              {projects.length}
            </span>
          </h2>
          <Link href={`/workspaces/${workspace.id}/projects/new`}>
            <Button>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Create your first project to start tracking issues
            </p>
            <Link href={`/workspaces/${workspace.id}/projects/new`}>
              <Button>Create First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/workspaces/${workspace.id}/projects/${project.id}`}
                className="group card-hover animate-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 shadow-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ 
                      backgroundColor: project.color,
                      boxShadow: `0 4px 12px ${project.color}30`
                    }}
                  >
                    {project.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">
                      /{project.slug}
                    </p>
                  </div>
                  
                  {project.totalIssues && project.totalIssues > 0 ? (
                    <ProgressRing 
                      total={project.totalIssues} 
                      completed={project.closedIssues || 0} 
                      size={24}
                      strokeWidth={2.5}
                      color={project.color}
                    />
                  ) : null}
                </div>
                {project.description && (
                  <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {project.totalIssues && project.totalIssues > 0 
                      ? `${project.closedIssues}/${project.totalIssues} completed`
                      : 'No issues yet'}
                  </span>
                  <span className="text-xs text-slate-500 group-hover:text-white transition-colors flex items-center gap-1">
                    View board
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
