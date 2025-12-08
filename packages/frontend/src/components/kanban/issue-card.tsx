'use client';

import Link from 'next/link';
import type { Issue } from './kanban-board';

const PRIORITY_CONFIG = {
  low: { color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Low' },
  medium: { color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Medium' },
  high: { color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'High' },
  urgent: { color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400', label: 'Urgent', pulse: true },
};

interface IssueCardProps {
  issue: Issue;
  workspaceId: string;
  projectId: string;
  isDragging?: boolean;
}

export function IssueCard({
  issue,
  workspaceId,
  projectId,
  isDragging,
}: IssueCardProps) {
  const priority = PRIORITY_CONFIG[issue.priority];

  const cardContent = (
    <div
      className={`
        group relative overflow-hidden
        bg-gradient-to-br from-white/[0.04] to-white/[0.02]
        border border-white/[0.06] rounded-lg p-3
        hover:border-white/[0.12] hover:from-white/[0.06] hover:to-white/[0.03]
        transition-all duration-200
        ${isDragging 
          ? 'shadow-xl shadow-primary-500/20 border-primary-500/40 scale-[1.02] rotate-1' 
          : ''
        }
      `}
    >
      {/* Priority indicator line */}
      <div 
        className="absolute top-0 left-0 w-full h-0.5 opacity-60"
        style={{ backgroundColor: priority.color }}
      />

      {/* Header: Number & Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 text-xs font-mono font-medium">
          #{issue.number}
        </span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priority.bg} ${priority.text}`}>
          {priority.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-[13px] text-slate-100 leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
        {issue.title}
      </h3>

      {/* Labels */}
      {issue.labelDetails.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {issue.labelDetails.slice(0, 2).map((label) => (
            <span
              key={label.id}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: `${label.color}15`,
                color: label.color,
                border: `1px solid ${label.color}30`,
              }}
            >
              {label.name}
            </span>
          ))}
          {issue.labelDetails.length > 2 && (
            <span className="text-[10px] text-slate-500 px-1">
              +{issue.labelDetails.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
        {/* Assignee */}
        {issue.assignee ? (
          <div className="flex items-center gap-1.5">
            {issue.assignee.image ? (
              <img
                src={issue.assignee.image}
                alt=""
                className="w-5 h-5 rounded-full ring-1 ring-white/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-semibold text-white shadow-sm">
                {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
              </div>
            )}
            <span className="text-[11px] text-slate-400 truncate max-w-[70px]">
              {issue.assignee.name?.split(' ')[0] || issue.assignee.email.split('@')[0]}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-600 italic">Unassigned</span>
        )}

        {/* Date */}
        <span className="text-[10px] text-slate-600">
          {new Date(issue.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );

  if (isDragging) {
    return cardContent;
  }

  return (
    <Link
      href={`/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
      onClick={(e) => {
        if (e.defaultPrevented) return;
      }}
    >
      {cardContent}
    </Link>
  );
}
