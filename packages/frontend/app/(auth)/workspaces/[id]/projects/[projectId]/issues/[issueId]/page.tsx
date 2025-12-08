'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Card, Markdown, useToast } from '@/components/ui';

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
  dueDate: string | null;
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

interface HistoryEntry {
  id: string;
  issueId: string;
  userId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Member {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [issueId]);

  async function fetchData() {
    try {
      const [issueRes, commentsRes, statusesRes, labelsRes, membersRes] = await Promise.all([
        fetch(`/api/issues/${issueId}`),
        fetch(`/api/issues/${issueId}/comments`),
        fetch(`/api/projects/${projectId}/statuses`),
        fetch(`/api/projects/${projectId}/labels`),
        fetch(`/api/workspaces/${workspaceId}/members`),
      ]);

      const issueData = await issueRes.json();
      const commentsData = await commentsRes.json();
      const statusesData = await statusesRes.json();
      const labelsData = await labelsRes.json();
      const membersData = await membersRes.json();

      setIssue(issueData.data);
      setComments(commentsData.data || []);
      setStatuses(statusesData.data || []);
      setProjectLabels(labelsData.data || []);
      setMembers(membersData.data || []);

      // Fetch history separately to avoid blocking main data
      try {
        const historyRes = await fetch(`/api/issues/${issueId}/history`);
        const historyData = await historyRes.json();
        setHistory(historyData.data || []);
      } catch {
        setHistory([]);
      }
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

  async function handleDueDateChange(newDueDate: string | null) {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDueDate }),
      });

      if (res.ok) {
        addToast('Due date updated', 'success');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update due date:', err);
      addToast('Failed to update due date', 'error');
    }
  }

  async function handleAssigneeChange(userId: string | null) {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId }),
      });

      if (res.ok) {
        addToast(userId ? 'Assignee updated' : 'Assignee removed', 'success');
        setShowAssigneePicker(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update assignee:', err);
      addToast('Failed to update assignee', 'error');
    }
  }

  async function handleSaveDescription() {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionDraft || null }),
      });

      if (res.ok) {
        addToast('Description updated', 'success');
        setEditingDescription(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update description:', err);
      addToast('Failed to update description', 'error');
    }
  }

  function startEditingDescription() {
    setDescriptionDraft(issue?.description || '');
    setEditingDescription(true);
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
        addToast('Comment added', 'success');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      addToast('Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  }

  function startEditingComment(comment: Comment) {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingCommentContent('');
  }

  async function handleSaveComment() {
    if (!editingCommentId || !editingCommentContent.trim()) return;

    try {
      const res = await fetch(`/api/comments/${editingCommentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingCommentContent }),
      });

      if (res.ok) {
        addToast('Comment updated', 'success');
        cancelEditingComment();
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
      addToast('Failed to update comment', 'error');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        addToast('Comment deleted', 'success');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      addToast('Failed to delete comment', 'error');
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-400">
                Description
              </h2>
              {!editingDescription ? (
                <button
                  onClick={startEditingDescription}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingDescription(false)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
            
            {editingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  placeholder="Add a description... (Markdown supported)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none font-mono text-sm"
                  rows={10}
                />
                <p className="text-[10px] text-slate-500">
                  Supports Markdown: **bold**, *italic*, `code`, [links](url), lists, and more
                </p>
              </div>
            ) : issue.description ? (
              <Markdown content={issue.description} />
            ) : (
              <button
                onClick={startEditingDescription}
                className="text-slate-500 italic hover:text-slate-400 transition-colors"
              >
                Click to add description...
              </button>
            )}
          </Card>

          {/* Comments */}
          <Card className="p-6 bg-surface-card border-white/[0.06]">
            <h2 className="text-sm font-medium text-slate-400 mb-4">
              Comments ({comments.length})
            </h2>

            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="group flex gap-3">
                  {comment.author.image ? (
                    <img
                      src={comment.author.image}
                      alt=""
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-sm text-primary-400 flex-shrink-0">
                      {(comment.author.name || comment.author.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
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
                      
                      {/* Edit/Delete buttons - visible on hover */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditingComment(comment)}
                          className="p-1 text-slate-500 hover:text-primary-400 transition-colors"
                          title="Edit comment"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete comment"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Comment content - editable or markdown */}
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none text-sm"
                          rows={4}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditingComment}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveComment}
                            className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <Markdown content={comment.content} />
                      </div>
                    )}
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
                placeholder="Add a comment... (Markdown supported)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none text-sm text-white placeholder-slate-500"
                rows={3}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-slate-500">
                  **bold**, *italic*, `code`, [links](url)
                </p>
                <Button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                >
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Activity Log */}
          <Card className="p-6 bg-surface-card border-white/[0.06]">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-sm font-medium text-slate-400">
                Activity ({history.length})
              </h2>
              <svg 
                className={`w-4 h-4 text-slate-500 transition-transform ${showHistory ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && (
              <div className="mt-4 space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center">
                      {entry.action === 'created' && (
                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      {entry.action === 'updated' && (
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      )}
                      {entry.action === 'commented' && (
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300">
                        {entry.action === 'created' && 'Issue created'}
                        {entry.action === 'commented' && 'Added a comment'}
                        {entry.action === 'updated' && entry.fieldName && (
                          <>
                            Changed <span className="text-white font-medium">{entry.fieldName}</span>
                            {entry.oldValue && entry.newValue && (
                              <>
                                {' '}from <span className="text-slate-400">
                                  {entry.fieldName === 'status' 
                                    ? statuses.find(s => s.id === entry.oldValue)?.name || entry.oldValue
                                    : entry.oldValue}
                                </span>
                                {' '}to <span className="text-white">
                                  {entry.fieldName === 'status' 
                                    ? statuses.find(s => s.id === entry.newValue)?.name || entry.newValue
                                    : entry.newValue}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(entry.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No activity yet
                  </p>
                )}
              </div>
            )}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assignee</h3>
              <button
                onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                {showAssigneePicker ? 'Done' : 'Edit'}
              </button>
            </div>
            
            {showAssigneePicker ? (
              <div className="space-y-1">
                {/* Unassign option */}
                <button
                  onClick={() => handleAssigneeChange(null)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                    !issue.assignee
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center text-xs text-slate-500">
                    —
                  </div>
                  <span className="text-sm">Unassigned</span>
                </button>
                
                {/* Member options */}
                {members.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => handleAssigneeChange(member.userId)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                      issue.assignee?.id === member.userId
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    {member.user.image ? (
                      <img
                        src={member.user.image}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-400">
                        {(member.user.name || member.user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm truncate">
                      {member.user.name || member.user.email}
                    </span>
                  </button>
                ))}
                
                {members.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-2">No members found</p>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
          </Card>

          {/* Due Date */}
          <Card className={`p-4 bg-surface-card border-white/[0.06] ${
            issue.dueDate && new Date(issue.dueDate) < new Date() 
              ? 'border-l-2 border-l-red-500' 
              : ''
          }`}>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Due Date</h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={issue.dueDate ? new Date(issue.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleDueDateChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 [color-scheme:dark]"
              />
              {issue.dueDate && (
                <button
                  onClick={() => handleDueDateChange(null)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Clear due date"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {issue.dueDate && (
              <p className={`text-xs mt-2 ${
                new Date(issue.dueDate) < new Date() 
                  ? 'text-red-400' 
                  : new Date(issue.dueDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000
                    ? 'text-amber-400'
                    : 'text-slate-400'
              }`}>
                {new Date(issue.dueDate) < new Date() 
                  ? `Overdue by ${Math.ceil((new Date().getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                  : `${Math.ceil((new Date(issue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                }
              </p>
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
