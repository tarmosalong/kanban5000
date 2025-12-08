'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { KanbanBoard, type Issue, type IssueStatus } from '@/components/kanban';

interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
}

export default function ProjectPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, statusesRes, issuesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/statuses`),
        fetch(`/api/projects/${projectId}/issues?includeClosed=true`),
      ]);

      if (!projectRes.ok) throw new Error('Failed to load project');

      const projectData = await projectRes.json();
      const statusesData = await statusesRes.json();
      const issuesData = await issuesRes.json();

      setProject(projectData.data);
      setStatuses(
        (statusesData.data || []).map((s: any) => ({
          ...s,
          position: s.position ?? 0,
        }))
      );
      setIssues(issuesData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleIssueMove = useCallback(
    async (issueId: string, newStatusId: string) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      if (!res.ok) {
        throw new Error('Failed to update issue');
      }

      await fetchData();
    },
    [fetchData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
          <Link href={`/workspaces/${workspaceId}`}>
            <Button variant="secondary">Back to Workspace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalIssues = issues.length;
  const openIssues = issues.filter((i) => !i.status.name.toLowerCase().includes('done')).length;

  return (
    <div className="flex flex-col h-[calc(100vh-var(--nav-height))]">
      {/* Header - compact */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspaces/${workspaceId}`}
              className="text-slate-500 hover:text-white transition-colors text-sm"
            >
              ← Back
            </Link>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-md shadow-lg"
                style={{ 
                  backgroundColor: project.color,
                  boxShadow: `0 2px 8px ${project.color}40`
                }}
              />
              <div>
                <h1 className="text-lg font-semibold text-white">{project.name}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400">{openIssues} open</span>
              </div>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">{totalIssues} total</span>
            </div>
            <Link href={`/workspaces/${workspaceId}/projects/${projectId}/issues/new`}>
              <Button>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Issue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Kanban Board - fills remaining space */}
      <div className="flex-1 overflow-hidden p-4">
        {issues.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No issues yet</h2>
              <p className="text-slate-400 mb-6 max-w-sm">
                Create your first issue to start tracking work on this project
              </p>
              <Link href={`/workspaces/${workspaceId}/projects/${projectId}/issues/new`}>
                <Button>Create First Issue</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-x-auto">
            <div className="flex gap-3 h-full pb-2">
              <KanbanBoard
                statuses={statuses}
                issues={issues}
                workspaceId={workspaceId}
                projectId={projectId}
                onIssueMove={handleIssueMove}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
