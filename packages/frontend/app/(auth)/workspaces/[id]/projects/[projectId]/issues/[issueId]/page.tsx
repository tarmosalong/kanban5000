'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Issue {
  id: string;
  number: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: {
    id: string;
    name: string;
    color: string;
  };
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  labels: string[];
  labelDetails: Label[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface IssueStatus {
  id: string;
  name: string;
  color: string;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export default function IssuePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;
  const issueId = params.issueId as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  useEffect(() => {
    fetchData();
  }, [issueId]);

  async function fetchData() {
    try {
      const [issueRes, commentsRes, statusesRes, labelsRes] = await Promise.all([
        fetch(`/api/issues/${issueId}`),
        fetch(`/api/issues/${issueId}/comments`),
        fetch(`/api/projects/${projectId}/statuses`),
        fetch(`/api/projects/${projectId}/labels`),
      ]);

      const issueData = await issueRes.json();
      const commentsData = await commentsRes.json();
      const statusesData = await statusesRes.json();
      const labelsData = await labelsRes.json();

      setIssue(issueData.data);
      setComments(commentsData.data || []);
      setStatuses(statusesData.data || []);
      setProjectLabels(labelsData.data || []);
    } catch (err) {
      console.error('Failed to fetch issue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatusId: string) {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handlePriorityChange(newPriority: string) {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  }

  async function handleToggleLabel(labelId: string) {
    if (!issue) return;
    
    const currentLabels = issue.labels || [];
    const hasLabel = currentLabels.includes(labelId);
    const newLabels = hasLabel 
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labels: newLabels }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update labels:', err);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-8">
        <Card className="p-6 border-red-500/30 bg-red-500/10">
          <p className="text-red-400">Issue not found</p>
        </Card>
      </div>
    );
  }

  const priorityInfo = PRIORITY_OPTIONS.find(p => p.value === issue.priority) || PRIORITY_OPTIONS[1];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}`}
          className="hover:text-white transition-colors"
        >
          ← Back to board
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-slate-500 font-mono text-sm">#{issue.number}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${priorityInfo.color}20`,
              color: priorityInfo.color,
            }}
          >
            {priorityInfo.label}
          </span>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${issue.status.color}20`,
              color: issue.status.color,
            }}
          >
            {issue.status.name}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">{issue.title}</h1>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6 bg-surface-card border-white/[0.06]">
            <h2 className="text-sm font-medium text-slate-400 mb-3">
              Description
            </h2>
            {issue.description ? (
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300">
                {issue.description}
              </div>
            ) : (
              <p className="text-slate-500 italic">No description provided</p>
            )}
          </Card>

          {/* Comments */}
          <Card className="p-6 bg-surface-card border-white/[0.06]">
            <h2 className="text-sm font-medium text-slate-400 mb-4">
              Comments ({comments.length})
            </h2>

            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {comment.author.image ? (
                    <img
                      src={comment.author.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-sm text-primary-400">
                      {(comment.author.name || comment.author.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-white">
                        {comment.author.name || comment.author.email}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {comment.editedAt && (
                        <span className="text-slate-500 text-xs">(edited)</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">
                  No comments yet
                </p>
              )}
            </div>

            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none text-sm text-white placeholder-slate-500"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card className="p-4 bg-surface-card border-white/[0.06]">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Status</h3>
            <div className="flex flex-wrap gap-1">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleStatusChange(status.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    issue.status.id === status.id
                      ? 'ring-2 ring-offset-1 ring-offset-surface-card'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${status.color}20`,
                    color: status.color,
                  }}
                >
                  {status.name}
                </button>
              ))}
            </div>
          </Card>

          {/* Priority */}
          <Card className="p-4 bg-surface-card border-white/[0.06]">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Priority</h3>
            <div className="flex flex-wrap gap-1">
              {PRIORITY_OPTIONS.map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => handlePriorityChange(priority.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    issue.priority === priority.value
                      ? 'ring-2 ring-offset-1 ring-offset-surface-card'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${priority.color}20`,
                    color: priority.color,
                  }}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Labels */}
          <Card className="p-4 bg-surface-card border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Labels</h3>
              <button
                onClick={() => setShowLabelPicker(!showLabelPicker)}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                {showLabelPicker ? 'Done' : 'Edit'}
              </button>
            </div>
            
            {showLabelPicker ? (
              <div className="flex flex-wrap gap-1">
                {projectLabels.map((label) => {
                  const isSelected = issue.labels?.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label.id)}
                      className={`px-2 py-0.5 text-xs font-medium rounded transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-1 ring-offset-surface-card'
                          : 'opacity-50 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                        border: `1px solid ${label.color}40`,
                      }}
                    >
                      {label.name}
                    </button>
                  );
                })}
                {projectLabels.length === 0 && (
                  <p className="text-slate-500 text-xs">No labels in project</p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {issue.labelDetails && issue.labelDetails.length > 0 ? (
                  issue.labelDetails.map((label) => (
                    <span
                      key={label.id}
                      className="px-2 py-0.5 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                        border: `1px solid ${label.color}40`,
                      }}
                    >
                      {label.name}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs">No labels</p>
                )}
              </div>
            )}
          </Card>

          {/* Assignee */}
          <Card className="p-4 bg-surface-card border-white/[0.06]">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Assignee</h3>
            {issue.assignee ? (
              <div className="flex items-center gap-2">
                {issue.assignee.image ? (
                  <img
                    src={issue.assignee.image}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">
                    {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-white">
                  {issue.assignee.name || issue.assignee.email}
                </span>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Unassigned</p>
            )}
          </Card>

          {/* Dates */}
          <Card className="p-4 bg-surface-card border-white/[0.06]">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Created</h3>
            <p className="text-sm text-white">
              {new Date(issue.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              by {issue.creator.name || issue.creator.email}
            </p>
          </Card>

          {issue.closedAt && (
            <Card className="p-4 bg-surface-card border-emerald-500/30">
              <h3 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">
                Closed
              </h3>
              <p className="text-sm text-white">
                {new Date(issue.closedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
