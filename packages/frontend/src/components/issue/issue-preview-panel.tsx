'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Issue } from '@/components/kanban';

interface IssuePreviewPanelProps {
  issue: Issue | null;
  workspaceId: string;
  projectId: string;
  projectKey: string;
  onClose: () => void;
}

const PRIORITY_CONFIG = {
  low: { color: '#71717a', bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Low' },
  medium: { color: '#60a5fa', bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Medium' },
  high: { color: '#fbbf24', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'High' },
  urgent: { color: '#f87171', bg: 'bg-red-500/10', text: 'text-red-400', label: 'Urgent' },
};

export function IssuePreviewPanel({ 
  issue, 
  workspaceId, 
  projectId,
  projectKey,
  onClose 
}: IssuePreviewPanelProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (issue) {
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
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/[0.04] shadow-2xl z-50 
          transform transition-transform duration-200 ease-out overflow-hidden flex flex-col
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 font-mono text-[12px]">{projectKey}-{issue.number}</span>
              <span 
                className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${issue.status.color}15`,
                  color: issue.status.color,
                }}
              >
                {issue.status.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleOpenFullView}
                className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] rounded-md transition-colors"
                title="Open full view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Title */}
            <h2 
              className="text-lg font-medium text-white mb-5 leading-tight cursor-pointer hover:text-accent-400 transition-colors tracking-tight"
              onClick={handleOpenFullView}
            >
              {issue.title}
            </h2>

            {/* Meta info */}
            <div className="space-y-4 mb-6">
              {/* Priority */}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                <span className="text-[12px] text-zinc-500">Priority</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${priority.bg} ${priority.text}`}>
                  {priority.label}
                </span>
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                <span className="text-[12px] text-zinc-500">Assignee</span>
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    {issue.assignee.image ? (
                      <img src={issue.assignee.image} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-accent-500/20 flex items-center justify-center text-[10px] text-accent-400 font-medium">
                        {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-[13px] text-zinc-300">
                      {issue.assignee.name || issue.assignee.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-[13px] text-zinc-600">Unassigned</span>
                )}
              </div>

              {/* Due date */}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                <span className="text-[12px] text-zinc-500">Due date</span>
                {issue.dueDate ? (
                  <span className={`text-[13px] ${isOverdue ? 'text-red-400' : 'text-zinc-300'}`}>
                    {new Date(issue.dueDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {isOverdue && (
                      <span className="ml-1.5 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Overdue</span>
                    )}
                  </span>
                ) : (
                  <span className="text-[13px] text-zinc-700">—</span>
                )}
              </div>

              {/* Created */}
              <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                <span className="text-[12px] text-zinc-500">Created</span>
                <span className="text-[13px] text-zinc-500">
                  {new Date(issue.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Labels */}
            {issue.labelDetails.length > 0 && (
              <div className="mb-6">
                <span className="text-[12px] text-zinc-500 block mb-2">Labels</span>
                <div className="flex flex-wrap gap-1.5">
                  {issue.labelDetails.map((label) => (
                    <span
                      key={label.id}
                      className="text-[11px] px-2 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: `${label.color}12`,
                        color: label.color,
                        border: `1px solid ${label.color}20`,
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
              <span className="text-[12px] text-zinc-500 block mb-2">Description</span>
              {issue.description ? (
                <div className="prose prose-invert prose-sm max-w-none text-zinc-400 prose-p:text-zinc-400 prose-headings:text-zinc-200 prose-strong:text-zinc-200 prose-a:text-accent-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {issue.description}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-[13px] text-zinc-700">No description</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-white/[0.04]">
          <button
            onClick={handleOpenFullView}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-400 text-zinc-900 text-[13px] font-medium rounded-lg transition-colors"
          >
            Open full view
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
