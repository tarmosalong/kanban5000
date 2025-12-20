'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button, useToast, PageLoader } from '@/components/ui';
import { KanbanBoard, type Issue, type IssueStatus } from '@/components/kanban';
import { IssuePreviewPanel, IssueCalendarView } from '@/components/issue';
import { ActivityFeedSidebar, ProjectStatsPanel } from '@/components/project';
import { getProjectKey } from '@/lib/issue-key';

interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Filters {
  priority: string | null;
  assigneeId: string | null;
  labelId: string | null;
  statusId: string | null;
  sortKey: 'number' | 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

const PRIORITY_ORDER = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'low', label: 'Low', color: '#6b7280' },
];

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;
  const issueIdFromUrl = searchParams.get('issue');

  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    priority: null,
    assigneeId: null,
    labelId: null,
    statusId: null,
    sortKey: 'number',
    sortOrder: 'asc',
  });
  
  // View mode
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar'>('board');
  
  // Selected issue for preview panel
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Sync selected issue with URL
  useEffect(() => {
    if (issueIdFromUrl && issues.length > 0) {
      const issue = issues.find(i => i.id === issueIdFromUrl);
      if (issue) {
        setSelectedIssue(issue);
      }
    }
  }, [issueIdFromUrl, issues]);

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('issue', issue.id);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const handleClosePanel = () => {
    setSelectedIssue(null);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('issue');
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  // Activity Feed state
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  
  // Stats panel state
  const [showStats, setShowStats] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projectRes, statusesRes, issuesRes, labelsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/statuses`),
        fetch(`/api/projects/${projectId}/issues?includeClosed=true`),
        fetch(`/api/projects/${projectId}/labels`),
      ]);

      if (!projectRes.ok) throw new Error('Failed to load project');

      const projectData = await projectRes.json();
      const statusesData = await statusesRes.json();
      const issuesData = await issuesRes.json();
      const labelsData = await labelsRes.json();

      setProject(projectData.data);
      setStatuses(
        (statusesData.data || []).map((s: any) => ({
          ...s,
          position: s.position ?? 0,
        }))
      );
      setIssues(issuesData.data || []);
      setLabels(labelsData.data || []);
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
    async (issueId: string, newStatusId: string, position: number) => {
      try {
        const res = await fetch(`/api/issues/${issueId}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusId: newStatusId, position }),
        });

        if (!res.ok) {
          throw new Error('Failed to reorder issue');
        }

        const newStatus = statuses.find(s => s.id === newStatusId);
        addToast(`Issue moved to ${newStatus?.name || 'new status'}`, 'success');
        await fetchData();
      } catch (err) {
        addToast('Failed to move issue', 'error');
        throw err;
      }
    },
    [fetchData, statuses, addToast]
  );

  const handleQuickCreate = useCallback(
    async (title: string, statusId: string) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            statusId,
            priority: 'medium',
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to create issue');
        }

        addToast(`Issue "${title}" created`, 'success');
        await fetchData();
      } catch (err) {
        addToast('Failed to create issue', 'error');
        throw err;
      }
    },
    [projectId, fetchData, addToast]
  );

  // Get unique assignees from issues
  const assignees = useMemo(() => {
    const uniqueAssignees = new Map<string, { id: string; name: string; email: string; image?: string }>();
    issues.forEach((issue) => {
      if (issue.assignee) {
        uniqueAssignees.set(issue.assignee.id, issue.assignee);
      }
    });
    return Array.from(uniqueAssignees.values());
  }, [issues]);

  // Filter and Sort issues
  const filteredIssues = useMemo(() => {
    const filtered = issues.filter((issue) => {
      if (filters.priority && issue.priority !== filters.priority) {
        return false;
      }
      if (filters.assigneeId) {
        if (filters.assigneeId === 'unassigned') {
          // Show only unassigned issues
          if (issue.assignee) return false;
        } else {
          // Show only issues assigned to specific user
          if (issue.assignee?.id !== filters.assigneeId) return false;
        }
      }
      if (filters.labelId && !issue.labels.includes(filters.labelId)) {
        return false;
      }
      if (filters.statusId && issue.status.id !== filters.statusId) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortKey) {
        case 'number':
          comparison = a.number - b.number;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.name.localeCompare(b.status.name);
          break;
        case 'priority':
          comparison = (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] || 0) - 
                       (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] || 0);
          break;
        case 'assignee':
          const nameA = a.assignee?.name || a.assignee?.email || 'zzz';
          const nameB = b.assignee?.name || b.assignee?.email || 'zzz';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [issues, filters]);

  // Check if any filters are active
  const hasActiveFilters = filters.priority || filters.assigneeId || filters.labelId || filters.statusId;

  const clearFilters = () => {
    setFilters({ priority: null, assigneeId: null, labelId: null, statusId: null, sortKey: 'number', sortOrder: 'asc' });
  };

  const handleSort = (key: Filters['sortKey']) => {
    setFilters(prev => ({
      ...prev,
      sortKey: key,
      sortOrder: prev.sortKey === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <PageLoader text="Loading project..." />
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
                <span className="text-slate-400">
                  {hasActiveFilters ? `${filteredIssues.filter(i => !i.status.name.toLowerCase().includes('done')).length} shown` : `${openIssues} open`}
                </span>
              </div>
              <span className="text-slate-600">/</span>
              <span className="text-slate-500">{hasActiveFilters ? `${filteredIssues.length} filtered` : `${totalIssues} total`}</span>
            </div>
            
            {/* View toggle */}
            <div className="flex items-center bg-white/[0.05] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'board'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Board view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Calendar view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => setShowStats(true)}
              className={`p-2 rounded-lg transition-colors ${
                showStats
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Project Statistics"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            <button
              onClick={() => setShowActivityFeed(true)}
              className={`p-2 rounded-lg transition-colors ${
                showActivityFeed
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Recent Activity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>

            <Link
              href={`/workspaces/${workspaceId}/projects/${projectId}/settings`}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Project Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
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

      {/* Filter bar */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-4 flex-wrap">
            {/* Priority filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Priority</span>
              <div className="flex gap-1">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters(f => ({ 
                      ...f, 
                      priority: f.priority === opt.value ? null : opt.value 
                    }))}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${
                      filters.priority === opt.value
                        ? 'ring-2 ring-offset-1 ring-offset-surface'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${opt.color}20`,
                      color: opt.color,
                      ...(filters.priority === opt.value ? { ringColor: opt.color } : {}),
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Assignee filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Assignee</span>
              <select
                value={filters.assigneeId || ''}
                onChange={(e) => setFilters(f => ({ ...f, assigneeId: e.target.value || null }))}
                className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
              >
                <option value="">All</option>
                <option value="unassigned">Unassigned</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Label filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Label</span>
              <div className="flex gap-1 flex-wrap">
                {labels.slice(0, 5).map((label) => (
                  <button
                    key={label.id}
                    onClick={() => setFilters(f => ({
                      ...f,
                      labelId: f.labelId === label.id ? null : label.id
                    }))}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-all ${
                      filters.labelId === label.id
                        ? 'ring-2 ring-offset-1 ring-offset-surface'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      border: `1px solid ${label.color}40`,
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
              <div className="flex gap-1 flex-wrap">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setFilters(f => ({
                      ...f,
                      statusId: f.statusId === status.id ? null : status.id
                    }))}
                    className={`px-2 py-0.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${
                      filters.statusId === status.id
                        ? 'ring-2 ring-offset-1 ring-offset-surface'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${status.color}20`,
                      color: status.color,
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <>
                <div className="h-4 w-px bg-white/10" />
                <button
                  onClick={clearFilters}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>

      {/* Content - fills remaining space */}
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
        ) : filteredIssues.length === 0 && hasActiveFilters ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/10 flex items-center justify-center">
                <span className="text-4xl">🔍</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No matching issues</h2>
              <p className="text-slate-400 mb-6 max-w-sm">
                Try adjusting your filters to see more issues
              </p>
              <Button variant="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        ) : viewMode === 'board' ? (
          <div className="h-full overflow-x-auto">
            <div className="flex gap-3 h-full pb-2">
              <KanbanBoard
                statuses={statuses}
                issues={filteredIssues}
                workspaceId={workspaceId}
                projectId={projectId}
                projectKey={project ? getProjectKey(project.slug) : 'PROJ'}
                onIssueMove={handleIssueMove}
                onQuickCreate={handleQuickCreate}
                onIssueClick={handleIssueClick}
              />
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <IssueListView
            issues={filteredIssues}
            statuses={statuses}
            workspaceId={workspaceId}
            projectId={projectId}
            projectKey={project ? getProjectKey(project.slug) : 'PROJ'}
            onIssueClick={handleIssueClick}
            sortKey={filters.sortKey}
            sortOrder={filters.sortOrder}
            onSort={handleSort}
          />
        ) : (
          <IssueCalendarView
            issues={filteredIssues}
            statuses={statuses}
            workspaceId={workspaceId}
            projectId={projectId}
            projectKey={project ? getProjectKey(project.slug) : 'PROJ'}
            onIssueClick={handleIssueClick}
          />
        )}
      </div>

      {/* Issue Preview Panel */}
           <IssuePreviewPanel
             issue={selectedIssue}
             workspaceId={workspaceId}
             projectId={projectId}
             projectKey={project ? getProjectKey(project.slug) : 'PROJ'}
             onClose={handleClosePanel}
             onUpdate={fetchData}
           />

      <ActivityFeedSidebar
        projectId={projectId}
        projectSlug={project?.slug || ''}
        isOpen={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
      />

      <ProjectStatsPanel
        projectId={projectId}
        projectName={project?.name || ''}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />
    </div>
  );
}

// List view component
function IssueListView({ 
  issues, 
  statuses,
  workspaceId, 
  projectId,
  projectKey,
  onIssueClick,
  sortKey,
  sortOrder,
  onSort,
}: { 
  issues: Issue[]; 
  statuses: IssueStatus[];
  workspaceId: string; 
  projectId: string;
  projectKey: string;
  onIssueClick?: (issue: Issue) => void;
  sortKey: Filters['sortKey'];
  sortOrder: Filters['sortOrder'];
  onSort: (key: Filters['sortKey']) => void;
}) {
  const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
    medium: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    high: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    urgent: { bg: 'bg-red-500/10', text: 'text-red-400' },
  };

  const SortIcon = ({ column }: { column: Filters['sortKey'] }) => {
    if (sortKey !== column) return <div className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-30" />;
    return (
      <svg 
        className={`w-3 h-3 ml-1 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-surface z-10">
          <tr className="border-b border-white/[0.06]">
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-16 cursor-pointer hover:text-white transition-colors group"
              onClick={() => onSort('number')}
            >
              <div className="flex items-center">
                # <SortIcon column="number" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors group"
              onClick={() => onSort('title')}
            >
              <div className="flex items-center">
                Title <SortIcon column="title" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32 cursor-pointer hover:text-white transition-colors group"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center">
                Status <SortIcon column="status" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24 cursor-pointer hover:text-white transition-colors group"
              onClick={() => onSort('priority')}
            >
              <div className="flex items-center">
                Priority <SortIcon column="priority" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-40 cursor-pointer hover:text-white transition-colors group"
              onClick={() => onSort('assignee')}
            >
              <div className="flex items-center">
                Assignee <SortIcon column="assignee" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:text-white transition-colors group"
              onClick={() => onSort('dueDate')}
            >
              <div className="flex items-center">
                Due Date <SortIcon column="dueDate" />
              </div>
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-28 cursor-pointer hover:text-white transition-colors group"
              onClick={() => onSort('createdAt')}
            >
              <div className="flex items-center">
                Created <SortIcon column="createdAt" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {issues.map((issue) => {
            const priorityStyle = PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.medium;
            const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();
            
            return (
              <tr 
                key={issue.id} 
                className="hover:bg-white/[0.02] transition-colors group relative"
              >
                <td className="px-4 py-3 relative">
                  {/* Priority vertical indicator for list view */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-[2px]" 
                    style={{ backgroundColor: PRIORITY_OPTIONS.find(p => p.value === issue.priority)?.color }}
                  />
                  <span className="text-slate-500 font-mono text-sm">{projectKey}-{issue.number}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onIssueClick?.(issue)}
                    className="text-slate-100 hover:text-primary-400 transition-colors font-medium text-left"
                  >
                    {issue.title}
                  </button>
                  {issue.labelDetails.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {issue.labelDetails.slice(0, 3).map((label) => (
                        <span
                          key={label.id}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${label.color}15`,
                            color: label.color,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                      {issue.labelDetails.length > 3 && (
                        <span className="text-[10px] text-slate-500">+{issue.labelDetails.length - 3}</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${issue.status.color}15`,
                      color: issue.status.color,
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: issue.status.color }}
                    />
                    {issue.status.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${priorityStyle.bg} ${priorityStyle.text}`}>
                    {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {issue.assignee ? (
                    <div className="flex items-center gap-2">
                      {issue.assignee.image ? (
                        <img src={issue.assignee.image} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">
                          {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-slate-300 truncate">
                        {issue.assignee.name?.split(' ')[0] || issue.assignee.email.split('@')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-600 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {issue.dueDate ? (
                    <span className={`text-sm ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                      {new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-500">
                    {new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
