'use client';

import type { Issue } from './types';

const PRIORITY_CONFIG = {
  low: { color: '#71717a', bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Low' },
  medium: { color: '#60a5fa', bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Medium' },
  high: { color: '#fbbf24', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'High' },
  urgent: { color: '#f87171', bg: 'bg-red-500/10', text: 'text-red-400', label: 'Urgent' },
};

interface IssueCardProps {
  issue: Issue;
  workspaceId: string;
  projectId: string;
  isDragging?: boolean;
  onClick?: (issue: Issue) => void;
}

function getDueDateStatus(dueDate: string | null): { 
  isOverdue: boolean; 
  isDueSoon: boolean;
  label: string | null;
} {
  if (!dueDate) return { isOverdue: false, isDueSoon: false, label: null };
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { 
      isOverdue: true, 
      isDueSoon: false, 
      label: diffDays === -1 ? 'Overdue 1 day' : `Overdue ${Math.abs(diffDays)} days` 
    };
  }
  
  if (diffDays === 0) {
    return { isOverdue: false, isDueSoon: true, label: 'Due today' };
  }
  
  if (diffDays <= 3) {
    return { 
      isOverdue: false, 
      isDueSoon: true, 
      label: diffDays === 1 ? 'Due tomorrow' : `Due in ${diffDays} days` 
    };
  }
  
  return { 
    isOverdue: false, 
    isDueSoon: false, 
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
  };
}

export function IssueCard({
  issue,
  workspaceId,
  projectId,
  isDragging,
  onClick,
}: IssueCardProps) {
  const priority = PRIORITY_CONFIG[issue.priority];
  const dueDateStatus = getDueDateStatus(issue.dueDate);

  const cardContent = (
    <div
      className={`
        group relative overflow-hidden
        bg-zinc-900/50 backdrop-blur-sm
        border border-white/[0.04] rounded-lg
        hover:border-white/[0.08] hover:bg-zinc-900/70
        transition-all duration-150
        ${isDragging 
          ? 'shadow-lg shadow-accent-500/10 border-accent-500/30 scale-[1.02]' 
          : ''
        }
        ${dueDateStatus.isOverdue ? 'border-l-2 border-l-red-500/60' : ''}
      `}
    >
      {/* Content */}
      <div className="p-3">
        {/* Header: Number & Priority */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-600 text-[11px] font-mono">
            #{issue.number}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priority.bg} ${priority.text}`}>
            {priority.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-medium text-[13px] text-zinc-200 leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
          {issue.title}
        </h3>

        {/* Labels */}
        {issue.labelDetails.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {issue.labelDetails.slice(0, 2).map((label) => (
              <span
                key={label.id}
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `${label.color}12`,
                  color: label.color,
                  border: `1px solid ${label.color}20`,
                }}
              >
                {label.name}
              </span>
            ))}
            {issue.labelDetails.length > 2 && (
              <span className="text-[10px] text-zinc-600 px-1">
                +{issue.labelDetails.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Due Date Badge */}
        {dueDateStatus.label && (
          <div className="mb-2">
            <span
              className={`
                inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium
                ${dueDateStatus.isOverdue 
                  ? 'bg-red-500/10 text-red-400' 
                  : dueDateStatus.isDueSoon 
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-zinc-500/10 text-zinc-500'
                }
              `}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dueDateStatus.label}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
          {/* Assignee */}
          {issue.assignee ? (
            <div className="flex items-center gap-1.5">
              {issue.assignee.image ? (
                <img
                  src={issue.assignee.image}
                  alt=""
                  className="w-5 h-5 rounded-full ring-1 ring-white/[0.06]"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-[9px] font-medium text-zinc-900">
                  {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
                </div>
              )}
              <span className="text-[11px] text-zinc-500 truncate max-w-[70px]">
                {issue.assignee.name?.split(' ')[0] || issue.assignee.email.split('@')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-700">Unassigned</span>
          )}

          {/* Date */}
          <span className="text-[10px] text-zinc-700">
            {new Date(issue.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );

  if (isDragging) {
    return cardContent;
  }

  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={(e) => {
        if (e.defaultPrevented) return;
        onClick?.(issue);
      }}
    >
      {cardContent}
    </button>
  );
}
