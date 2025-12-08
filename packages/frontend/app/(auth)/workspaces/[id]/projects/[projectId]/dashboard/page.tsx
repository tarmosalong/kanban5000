'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
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
  AreaChart,
  Area,
  Legend,
} from 'recharts';

interface ProjectStats {
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  issuesByStatus: Array<{ statusId: string; statusName: string; statusColor: string; count: number }>;
  issuesByPriority: Array<{ priority: string; count: number }>;
  issuesByLabel: Array<{ labelId: string; labelName: string; labelColor: string; count: number }>;
  issuesOverTime: Array<{ date: string; created: number; closed: number }>;
  recentActivity: Array<{ date: string; type: string; count: number }>;
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

export default function DashboardPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: workspaceId, projectId } = use(params);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/projects/${projectId}/stats`);
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
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-center text-red-400">
        <p>{error || 'Failed to load dashboard'}</p>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Project analytics and insights</p>
        </div>
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}`}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Back to Board
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Issues"
          value={stats.totalIssues}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="primary"
        />
        <SummaryCard
          title="Open Issues"
          value={stats.openIssues}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="amber"
        />
        <SummaryCard
          title="Closed Issues"
          value={stats.closedIssues}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="emerald"
        />
        <SummaryCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="cyan"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Status */}
        <ChartCard title="Issues by Status">
          {stats.issuesByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.issuesByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="statusName"
                  label={({ statusName, count }) => `${statusName}: ${count}`}
                  labelLine={false}
                >
                  {stats.issuesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.statusColor} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No issues yet" />
          )}
        </ChartCard>

        {/* Issues by Priority */}
        <ChartCard title="Issues by Priority">
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData} layout="vertical">
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={70} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
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
            <EmptyChart message="No issues yet" />
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues Over Time */}
        <ChartCard title="Issues Over Time (Last 30 Days)">
          {stats.issuesOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.issuesOverTime}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#14b8a6"
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                  name="Created"
                />
                <Area
                  type="monotone"
                  dataKey="closed"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorClosed)"
                  name="Closed"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No recent activity" />
          )}
        </ChartCard>

        {/* Issues by Label */}
        <ChartCard title="Issues by Label">
          {stats.issuesByLabel.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.issuesByLabel}>
                <XAxis 
                  dataKey="labelName" 
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.issuesByLabel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.labelColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No labels assigned" />
          )}
        </ChartCard>
      </div>

      {/* Status Breakdown */}
      <ChartCard title="Status Breakdown">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.issuesByStatus.map((status) => (
            <div
              key={status.statusId}
              className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.statusColor }}
                />
                <span className="text-sm font-medium text-slate-300">{status.statusName}</span>
              </div>
              <div className="text-2xl font-bold text-white">{status.count}</div>
              <div className="text-xs text-slate-500">
                {stats.totalIssues > 0
                  ? `${Math.round((status.count / stats.totalIssues) * 100)}%`
                  : '0%'}
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'primary' | 'amber' | 'emerald' | 'cyan';
}) {
  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// Empty Chart Placeholder
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[250px] text-slate-500 text-sm">
      {message}
    </div>
  );
}

