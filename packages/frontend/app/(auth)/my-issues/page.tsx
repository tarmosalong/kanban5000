'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, useToast, LoadingSpinner, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { IssuePreviewPanel } from '@/components/issue';
import { getProjectKey } from '@/lib/issue-key';

interface Filters {
  search: string;
  projectId: string | null;
  priority: string | null;
  sortKey: 'number' | 'title' | 'status' | 'priority' | 'dueDate';
  sortOrder: 'asc' | 'desc';
}

const PRIORITY_ORDER = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function MyIssuesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    projectId: null,
    priority: null,
    sortKey: 'dueDate',
    sortOrder: 'asc',
  });

  const issueIdFromUrl = searchParams.get('issue');

  // Sync selected issue with URL
  useEffect(() => {
    if (issueIdFromUrl && issues.length > 0) {
      const issue = issues.find(i => i.id === issueIdFromUrl);
      if (issue) {
        setSelectedIssue(issue);
      }
    }
  }, [issueIdFromUrl, issues]);

  const handleIssueClick = (issue: any) => {
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

  useEffect(() => {
    fetchIssues();
  }, []);

  async function fetchIssues() {
    try {
      const response = await fetch('/api/issues/my');
      if (!response.ok) throw new Error('Failed to load issues');
      const { data } = await response.json();
      setIssues(data || []);
    } catch (err) {
      addToast('Failed to load your issues', 'error');
    } finally {
      setLoading(false);
    }
  }

  const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-slate-500/10', text: 'text-zinc-400' },
    medium: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    high: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    urgent: { bg: 'bg-red-500/10', text: 'text-red-400' },
  };

  const projects = useMemo(() => {
    const uniqueProjects = new Map<string, { id: string; name: string }>();
    issues.forEach(issue => {
      if (issue.project) {
        uniqueProjects.set(issue.project.id, issue.project);
      }
    });
    return Array.from(uniqueProjects.values());
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const filtered = issues.filter(issue => {
      const matchesSearch = !filters.search || 
        issue.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        issue.number.toString().includes(filters.search) ||
        (issue.project && getProjectKey(issue.project.slug).toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesProject = !filters.projectId || issue.project?.id === filters.projectId;
      const matchesPriority = !filters.priority || issue.priority === filters.priority;

      return matchesSearch && matchesProject && matchesPriority;
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
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [issues, filters]);

  const handleSort = (key: Filters['sortKey']) => {
    setFilters(prev => ({
      ...prev,
      sortKey: key,
      sortOrder: prev.sortKey === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ column }: { column: Filters['sortKey'] }) => {
    if (filters.sortKey !== column) return <div className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-30" />;
    return (
      <svg 
        className={`w-3 h-3 ml-1 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-8 animate-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Issues</h1>
          <p className="text-zinc-500">Track all tasks assigned to you across all projects.</p>
        </div>
        <div className="bg-white/[0.05] px-3 py-1.5 rounded-lg border border-white/[0.06]">
          <span className="text-[13px] text-zinc-400">Total: </span>
          <span className="text-[13px] font-semibold text-white">{filteredIssues.length}</span>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-zinc-900/30 p-4 rounded-xl border border-white/[0.04]">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by title or number..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="bg-white/[0.03] border-white/[0.06]"
          />
        </div>
        
        <select
          value={filters.projectId || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value || null }))}
          className="bg-zinc-900 border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-zinc-300 outline-none focus:border-accent-500/50 transition-colors"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filters.priority || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || null }))}
          className="bg-zinc-900 border border-white/[0.06] rounded-lg px-3 py-2 text-[13px] text-zinc-300 outline-none focus:border-accent-500/50 transition-colors"
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {(filters.search || filters.projectId || filters.priority) && (
          <button
            onClick={() => setFilters({ search: '', projectId: null, priority: null })}
            className="text-[12px] text-zinc-500 hover:text-white transition-colors px-2"
          >
            Clear
          </button>
        )}
      </div>

      {filteredIssues.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 text-3xl">
            {filters.search || filters.projectId || filters.priority ? '🔍' : '🎉'}
          </div>
          <CardTitle>
            {filters.search || filters.projectId || filters.priority ? 'No matches' : 'All caught up!'}
          </CardTitle>
          <CardDescription>
            {filters.search || filters.projectId || filters.priority 
              ? 'Try adjusting your filters.' 
              : 'No issues are currently assigned to you.'}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/[0.02]">
                <tr className="border-b border-white/[0.06]">
                  <th 
                    className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-24 cursor-pointer hover:text-zinc-300 transition-colors group"
                    onClick={() => handleSort('number')}
                  >
                    <div className="flex items-center">
                      Issue <SortIcon column="number" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors group"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Title <SortIcon column="title" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-32 cursor-pointer hover:text-zinc-300 transition-colors group"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status <SortIcon column="status" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-24 cursor-pointer hover:text-zinc-300 transition-colors group"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center">
                      Priority <SortIcon column="priority" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-28 cursor-pointer hover:text-zinc-300 transition-colors group"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center">
                      Due Date <SortIcon column="dueDate" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredIssues.map((issue) => {
                  const priorityStyle = PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.medium;
                  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();
                  
                  return (
                    <tr 
                      key={issue.id} 
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => handleIssueClick(issue)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-zinc-500 font-mono text-[12px]">
                          {issue.project ? getProjectKey(issue.project.slug) : 'ISSUE'}-{issue.number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-[13px] group-hover:text-accent-400 transition-colors">
                          {issue.title}
                        </div>
                        <div className="text-[11px] text-zinc-600 mt-0.5">
                          {issue.project?.name || 'Project'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: issue.status.color }} />
                          <span className="text-[12px] text-zinc-300">{issue.status.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priorityStyle.bg} ${priorityStyle.text} border-transparent`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {issue.dueDate ? (
                          <span className={`text-[12px] ${isOverdue ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
                            {new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-[12px] text-zinc-700">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {selectedIssue && (
        <IssuePreviewPanel
          issue={selectedIssue}
          workspaceId={selectedIssue.project?.workspaceId || ''}
          projectId={selectedIssue.projectId}
          projectKey={selectedIssue.project ? getProjectKey(selectedIssue.project.slug) : 'ISSUE'}
          onClose={handleClosePanel}
          onUpdate={fetchIssues}
        />
      )}
    </div>
  );
}

