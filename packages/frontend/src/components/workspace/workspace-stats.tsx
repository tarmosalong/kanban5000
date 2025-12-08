'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WorkspaceStats {
  totalProjects: number;
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  issuesByPriority: Array<{ priority: string; count: number }>;
  issuesByAssignee: Array<{ userId: string; userName: string | null; userEmail: string; count: number }>;
  issuesByProject: Array<{ projectId: string; projectName: string; projectColor: string; count: number }>;
  recentIssues: Array<{ id: string; title: string; projectName: string; createdAt: string }>;
}

interface WorkspaceStatsProps {
  workspaceId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function WorkspaceStats({ workspaceId }: WorkspaceStatsProps) {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/stats`);
        if (!res.ok) throw new Error('Failed to load stats');
        const { data } = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        {error || 'No statistics available'}
      </div>
    );
  }

  if (stats.totalIssues === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No issues yet. Create some issues to see statistics.
      </div>
    );
  }

  const completionRate = stats.totalIssues > 0 
    ? Math.round((stats.closedIssues / stats.totalIssues) * 100) 
    : 0;

  const priorityData = stats.issuesByPriority.map(item => ({
    name: PRIORITY_LABELS[item.priority] || item.priority,
    value: item.count,
    color: PRIORITY_COLORS[item.priority] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Projects"
          value={stats.totalProjects}
          color="primary"
        />
        <StatCard
          label="Total Issues"
          value={stats.totalIssues}
          color="slate"
        />
        <StatCard
          label="Open"
          value={stats.openIssues}
          color="amber"
        />
        <StatCard
          label="Completion"
          value={`${completionRate}%`}
          color="emerald"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Issues by Priority */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">By Priority</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={priorityData} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={50} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-slate-500 text-xs">
              No data
            </div>
          )}
        </div>

        {/* Issues by Project */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">By Project</h3>
          {stats.issuesByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={stats.issuesByProject}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="projectName"
                >
                  {stats.issuesByProject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.projectColor} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                  formatter={(value, name, props) => [value, props.payload.projectName]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-slate-500 text-xs">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Top Assignees */}
      {stats.issuesByAssignee.length > 0 && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Top Contributors</h3>
          <div className="space-y-2">
            {stats.issuesByAssignee.slice(0, 5).map((assignee, index) => (
              <div key={assignee.userId} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-semibold text-white">
                  {(assignee.userName || assignee.userEmail)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">
                    {assignee.userName || assignee.userEmail.split('@')[0]}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full"
                      style={{ 
                        width: `${(assignee.count / stats.issuesByAssignee[0].count) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{assignee.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Issues */}
      {stats.recentIssues.length > 0 && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Issues</h3>
          <div className="space-y-2">
            {stats.recentIssues.map((issue) => (
              <div key={issue.id} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <span className="text-slate-200 truncate flex-1">{issue.title}</span>
                <span className="text-xs text-slate-500 truncate max-w-[100px]">{issue.projectName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: 'primary' | 'slate' | 'amber' | 'emerald';
}) {
  const colorClasses = {
    primary: 'border-primary-500/20 bg-primary-500/5',
    slate: 'border-slate-500/20 bg-slate-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
  };

  const textColors = {
    primary: 'text-primary-400',
    slate: 'text-slate-300',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color]}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${textColors[color]}`}>{value}</div>
    </div>
  );
}

