'use client';

import { useState, useEffect } from 'react';
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
import { LoadingSpinner } from '@/components/ui';

interface ProjectStats {
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
  issuesByStatus: Array<{ statusId: string; statusName: string; statusColor: string; count: number }>;
  issuesByPriority: Array<{ priority: string; count: number }>;
  issuesByLabel: Array<{ labelId: string; labelName: string; labelColor: string; count: number }>;
}

interface ProjectStatsPanelProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
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

export function ProjectStatsPanel({
  projectId,
  projectName,
  isOpen,
  onClose,
}: ProjectStatsPanelProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      fetchStats();
    } else {
      setIsVisible(false);
    }
  }, [isOpen, projectId]);

  async function fetchStats() {
    setLoading(true);
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

  if (!isOpen) return null;

  const completionRate = stats && stats.totalIssues > 0 
    ? Math.round((stats.closedIssues / stats.totalIssues) * 100) 
    : 0;

  const priorityData = stats?.issuesByPriority.map(item => ({
    name: PRIORITY_LABELS[item.priority] || item.priority,
    value: item.count,
    color: PRIORITY_COLORS[item.priority] || '#6b7280',
  })) || [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-950 border-l border-white/[0.04] shadow-2xl z-50 
          transform transition-transform duration-200 ease-out overflow-hidden flex flex-col
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Project Statistics</h2>
              <p className="text-[11px] text-zinc-500 truncate max-w-[200px]">{projectName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-5 text-center text-red-400 text-xs">{error}</div>
          ) : stats ? (
            <div className="p-5 space-y-6">
              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total Issues</div>
                  <div className="text-xl font-bold text-white">{stats.totalIssues}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Completion</div>
                  <div className="text-xl font-bold text-emerald-400">{completionRate}%</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Open</div>
                  <div className="text-xl font-bold text-blue-400">{stats.openIssues}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Closed</div>
                  <div className="text-xl font-bold text-zinc-400">{stats.closedIssues}</div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-400 px-1">Issues by Status</h3>
                <div className="space-y-2">
                  {stats.issuesByStatus.map((status) => (
                    <div key={status.statusId} className="flex items-center gap-3">
                      <div className="w-full flex-1 h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${stats.totalIssues > 0 ? (status.count / stats.totalIssues) * 100 : 0}%`,
                            backgroundColor: status.statusColor 
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 w-24">
                        <span className="text-[11px] text-zinc-500 truncate">{status.statusName}</span>
                        <span className="text-[11px] font-medium text-zinc-300">{status.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Chart */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-medium text-zinc-400 px-1">Priority Distribution</h3>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#09090b', 
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {priorityData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-zinc-500">{item.name}</span>
                      <span className="text-[10px] font-medium text-zinc-300 ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Labels */}
              {stats.issuesByLabel.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-medium text-zinc-400 px-1">Top Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.issuesByLabel.slice(0, 8).map((label) => (
                      <div 
                        key={label.labelId}
                        className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/[0.02] border border-white/[0.04]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.labelColor }} />
                        <span className="text-[10px] text-zinc-300">{label.labelName}</span>
                        <span className="text-[10px] text-zinc-600 font-medium">{label.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.04]">
          <button
            onClick={() => window.location.href = `/workspaces/${projectId}/projects/${projectId}/dashboard`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-white text-[12px] font-medium rounded-lg border border-white/[0.06] transition-colors"
          >
            View full dashboard
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

