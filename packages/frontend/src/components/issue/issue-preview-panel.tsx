'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Issue } from '@/components/kanban';

interface IssuePreviewPanelProps {
  issue: Issue | null;
  workspaceId: string;
  projectId: string;
  onClose: () => void;
}

const PRIORITY_CONFIG = {
  low: { color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Low' },
  medium: { color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Medium' },
  high: { color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'High' },
  urgent: { color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400', label: 'Urgent' },
};

export function IssuePreviewPanel({ 
  issue, 
  workspaceId, 
  projectId, 
  onClose 
}: IssuePreviewPanelProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (issue) {
      // Small delay for animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [issue]);

  if (!issue) return null;

  const priority = PRIORITY_CONFIG[issue.priority];
  const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();

  const handleOpenFullView = () => {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-surface border-l border-white/[0.06] shadow-2xl z-50 
          transform transition-transform duration-200 ease-out overflow-hidden flex flex-col
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-mono text-sm">#{issue.number}</span>
              <span 
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${issue.status.color}20`,
                  color: issue.status.color,
                }}
              >
                {issue.status.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenFullView}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                title="Open full view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Title */}
            <h2 
              className="text-xl font-semibold text-white mb-4 leading-tight cursor-pointer hover:text-primary-400 transition-colors"
              onClick={handleOpenFullView}
            >
              {issue.title}
            </h2>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Priority */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">
                  Priority
                </label>
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded ${priority.bg} ${priority.text}`}>
                  {priority.label}
                </span>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">
                  Assignee
                </label>
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    {issue.assignee.image ? (
                      <img src={issue.assignee.image} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400 font-medium">
                        {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-slate-200">
                      {issue.assignee.name || issue.assignee.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 italic">Unassigned</span>
                )}
              </div>

              {/* Due date */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">
                  Due date
                </label>
                {issue.dueDate ? (
                  <span className={`text-sm ${isOverdue ? 'text-red-400' : 'text-slate-200'}`}>
                    {new Date(issue.dueDate).toLocaleDateString('et-EE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {isOverdue && (
                      <span className="ml-2 text-xs text-red-400">(Overdue)</span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>

              {/* Created */}
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">
                  Created
                </label>
                <span className="text-sm text-slate-400">
                  {new Date(issue.createdAt).toLocaleDateString('et-EE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Labels */}
            {issue.labelDetails.length > 0 && (
              <div className="mb-6">
                <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {issue.labelDetails.map((label) => (
                    <span
                      key={label.id}
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: `${label.color}15`,
                        color: label.color,
                        border: `1px solid ${label.color}30`,
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">
                Description
              </label>
              {issue.description ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {issue.description}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No description</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={handleOpenFullView}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Open full view
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

