'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, useToast, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { IssuePreviewPanel } from '@/components/issue';
import { getProjectKey } from '@/lib/issue-key';

export default function MyIssuesPage() {
  const { addToast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  async function fetchIssues() {
    try {
      const data = await api.issues.my();
      setIssues(data);
    } catch (err) {
      addToast('Failed to load your issues', 'error');
    } finally {
      setLoading(false);
    }
  }

  const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
    medium: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    high: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    urgent: { bg: 'bg-red-500/10', text: 'text-red-400' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
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
          <span className="text-[13px] font-semibold text-white">{issues.length}</span>
        </div>
      </header>

      {issues.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 text-3xl">
            🎉
          </div>
          <CardTitle>All caught up!</CardTitle>
          <CardDescription>No issues are currently assigned to you.</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/[0.02]">
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-24">Issue</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-32">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-24">Priority</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-28">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {issues.map((issue) => {
                  const priorityStyle = PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.medium;
                  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();
                  
                  return (
                    <tr 
                      key={issue.id} 
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => setSelectedIssue(issue)}
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
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}

