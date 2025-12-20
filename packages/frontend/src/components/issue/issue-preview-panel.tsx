'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Issue, IssueStatus } from '@/components/kanban';
import { useToast, Card, Button, Markdown, PageLoader } from '@/components/ui';
import { getProjectKey } from '@/lib/issue-key';

interface Label {
  id: string;
  name: string;
  color: string;
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

interface IssuePreviewPanelProps {
  issue: Issue | null;
  workspaceId: string;
  projectId: string;
  projectKey: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export function IssuePreviewPanel({ 
  issue: initialIssue, 
  workspaceId, 
  projectId,
  projectKey,
  onClose,
  onUpdate 
}: IssuePreviewPanelProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();
  
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  
  // Data states
  const [issue, setIssue] = useState<any | null>(initialIssue);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  
  // UI states
  const [isAssigning, setIsAssigning] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  useEffect(() => {
    if (initialIssue) {
      setIssue(initialIssue);
      requestAnimationFrame(() => setIsVisible(true));
      fetchFullData(initialIssue.id);
    } else {
      setIsVisible(false);
    }
  }, [initialIssue]);

  const fetchFullData = async (issueId: string) => {
    setLoading(true);
    try {
      const [issueRes, commentsRes, statusesRes, labelsRes, membersRes, historyRes] = await Promise.all([
        fetch(`/api/issues/${issueId}`),
        fetch(`/api/issues/${issueId}/comments`),
        fetch(`/api/projects/${projectId}/statuses`),
        fetch(`/api/projects/${projectId}/labels`),
        fetch(`/api/workspaces/${workspaceId}/members`),
        fetch(`/api/issues/${issueId}/history`).catch(() => ({ json: () => ({ data: [] }) } as any)),
      ]);

      const issueData = await issueRes.json();
      const commentsData = await commentsRes.json();
      const statusesData = await statusesRes.json();
      const labelsData = await labelsRes.json();
      const membersData = await membersRes.json();
      const historyData = await historyRes.json();

      setIssue(issueData.data);
      setComments(commentsData.data || []);
      setStatuses(statusesData.data || []);
      setProjectLabels(labelsData.data || []);
      setMembers(membersData.data || []);
      setHistory(historyData.data || []);
    } catch (err) {
      console.error('Failed to fetch full issue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    if (issue) fetchFullData(issue.id);
    onUpdate?.();
  };

  const handleUpdateField = async (updates: any) => {
    if (!issue) return;
    try {
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        refreshData();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      addToast('Failed to update issue', 'error');
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!issue) return;
    const currentLabels = issue.labels || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter((id: string) => id !== labelId)
      : [...currentLabels, labelId];
    await handleUpdateField({ labels: newLabels });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !issue) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        addToast('Comment added', 'success');
        refreshData();
      }
    } catch (err) {
      addToast('Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleDraft.trim() || titleDraft === issue.title) {
      setEditingTitle(false);
      return;
    }
    await handleUpdateField({ title: titleDraft });
    setEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    await handleUpdateField({ description: descriptionDraft || null });
    setEditingDescription(false);
  };

  if (!initialIssue) return null;

  const currentIssue = issue || initialIssue;
  const priorityInfo = PRIORITY_OPTIONS.find(p => p.value === currentIssue.priority) || PRIORITY_OPTIONS[1];
  const isOverdue = currentIssue.dueDate && new Date(currentIssue.dueDate) < new Date();
  const isAssignedToMe = session?.backendUserId === currentIssue.assignee?.id;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-5xl bg-zinc-950 border-l border-white/[0.04] shadow-2xl z-50 
          transform transition-transform duration-300 ease-out overflow-hidden flex flex-col
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-zinc-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 font-mono text-sm tracking-wider">{projectKey}-{currentIssue.number}</span>
            <div className="h-4 w-px bg-white/10" />
            <button
              onClick={() => setActiveTab('details')}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'details' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'comments' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Comments {comments.length > 0 && `(${comments.length})`}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${activeTab === 'activity' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Activity
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/workspaces/${workspaceId}/projects/${projectId}/issues/${currentIssue.id}`)}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
              title="Open full page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Main Content (Left 2/3) */}
            <div className="md:col-span-2 p-8 space-y-8 border-r border-white/[0.04]">
              {/* Title Section */}
              <div className="group">
                {editingTitle ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      autoFocus
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveTitle();
                        }
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                      className="w-full text-2xl font-bold bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none"
                      rows={2}
                    />
                  </div>
                ) : (
                  <h1 
                    onClick={() => {
                      setTitleDraft(currentIssue.title);
                      setEditingTitle(true);
                    }}
                    className="text-2xl font-bold text-white leading-tight cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    {currentIssue.title}
                  </h1>
                )}
              </div>

              {/* Tabs Content */}
              {activeTab === 'details' && (
                <div className="space-y-8">
                  {/* Description */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</h3>
                      {!editingDescription && (
                        <button 
                          onClick={() => {
                            setDescriptionDraft(currentIssue.description || '');
                            setEditingDescription(true);
                          }}
                          className="text-[11px] text-accent-400 hover:text-accent-300 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {editingDescription ? (
                      <div className="space-y-3">
                        <textarea
                          autoFocus
                          value={descriptionDraft}
                          onChange={(e) => setDescriptionDraft(e.target.value)}
                          placeholder="Add a detailed description..."
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none font-mono text-sm"
                          rows={12}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingDescription(false)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveDescription}>Save Changes</Button>
                        </div>
                      </div>
                    ) : currentIssue.description ? (
                      <div className="prose prose-invert prose-sm max-w-none text-zinc-400 prose-p:leading-relaxed prose-headings:text-zinc-200 prose-a:text-accent-400">
                        <Markdown content={currentIssue.description} />
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingDescription(true)}
                        className="w-full py-8 border-2 border-dashed border-white/[0.02] rounded-xl text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.01] hover:border-white/[0.05] transition-all italic text-sm"
                      >
                        Add description...
                      </button>
                    )}
                  </div>

                  {/* Quick Activity Preview or Comments */}
                  <div className="pt-8 border-t border-white/[0.04]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Comments</h3>
                    </div>
                    <div className="space-y-6">
                      {comments.slice(0, 3).map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center text-xs font-bold text-accent-400 flex-shrink-0">
                            {(comment.author.name || comment.author.email || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-zinc-300">{comment.author.name || comment.author.email}</span>
                              <span className="text-[10px] text-zinc-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-sm text-zinc-400 line-clamp-3">
                              <Markdown content={comment.content} />
                            </div>
                          </div>
                        </div>
                      ))}
                      {comments.length > 3 && (
                        <button 
                          onClick={() => setActiveTab('comments')}
                          className="text-xs text-accent-400 hover:text-accent-300 font-medium"
                        >
                          View all {comments.length} comments
                        </button>
                      )}
                      <form onSubmit={handleAddComment} className="relative pt-4">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none min-h-[100px]"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <Button size="sm" type="submit" disabled={!newComment.trim() || submittingComment}>
                            {submittingComment ? 'Sending...' : 'Comment'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-sm font-bold text-accent-400 flex-shrink-0">
                          {(comment.author.name || comment.author.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-zinc-200">{comment.author.name || comment.author.email}</span>
                              <span className="text-[11px] text-zinc-600">{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-zinc-400 prose prose-invert prose-sm max-w-none">
                              <Markdown content={comment.content} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-12 text-zinc-600 italic text-sm">No comments yet. Be the first to comment!</div>
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="pt-8 border-t border-white/[0.04]">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 resize-none min-h-[120px]"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[10px] text-zinc-600 font-mono">Markdown is supported</span>
                      <Button type="submit" disabled={!newComment.trim() || submittingComment}>
                        {submittingComment ? 'Sending...' : 'Post Comment'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="w-1 bg-white/5 rounded-full" />
                      <div className="flex-1 py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-zinc-300">{entry.user?.name || entry.user?.email || 'System'}</span>
                          <span className="text-[10px] text-zinc-600">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {entry.action === 'created' ? 'created the issue' : 
                           entry.action === 'updated' ? (
                             <>updated <span className="text-zinc-300">{entry.fieldName}</span> from <span className="text-zinc-400">{entry.oldValue || 'none'}</span> to <span className="text-zinc-300">{entry.newValue || 'none'}</span></>
                           ) : entry.action === 'commented' ? 'added a comment' : entry.action}
                        </p>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-12 text-zinc-600 italic text-sm">No activity recorded yet.</div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Details (Right 1/3) */}
            <div className="p-6 space-y-8 bg-zinc-900/20">
              {/* Properties Section */}
              <div className="space-y-8">
                {/* Status Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map(s => (
                      <button
                        key={s.id}
                        onClick={() => handleUpdateField({ statusId: s.id })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all border ${
                          currentIssue.status.id === s.id 
                            ? 'bg-white/5 border-white/10 text-white shadow-lg' 
                            : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Priority
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITY_OPTIONS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => handleUpdateField({ priority: p.value })}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all border ${
                          currentIssue.priority === p.value 
                            ? 'bg-white/5 border-white/10 text-white' 
                            : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300'
                        }`}
                      >
                        <span style={{ color: p.color }}>●</span>
                        <span className="ml-1.5">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Assignee
                    </div>
                    <button 
                      onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                      className="text-[10px] text-accent-400 hover:text-accent-300 font-medium bg-accent-500/5 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {showAssigneePicker ? 'Cancel' : 'Change'}
                    </button>
                  </div>
                  
                  {showAssigneePicker ? (
                    <div className="space-y-1 bg-zinc-900/80 rounded-2xl p-2 border border-white/[0.06] max-h-60 overflow-y-auto shadow-2xl backdrop-blur-md">
                      <button
                        onClick={() => { handleUpdateField({ assignedTo: null }); setShowAssigneePicker(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-zinc-400 text-xs transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">—</div>
                        Unassign issue
                      </button>
                      {members.map(m => (
                        <button
                          key={m.userId}
                          onClick={() => { handleUpdateField({ assignedTo: m.userId }); setShowAssigneePicker(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs ${currentIssue.assignee?.id === m.userId ? 'bg-accent-500/10 text-accent-400 border border-accent-500/20' : 'bg-transparent border border-transparent hover:bg-white/5 text-zinc-300'}`}
                        >
                          {m.user.image ? (
                            <img src={m.user.image} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-[10px] font-bold text-accent-400">
                              {(m.user.name || m.user.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col items-start min-w-0">
                            <span className="font-medium truncate w-full text-left">{m.user.name || 'User'}</span>
                            <span className="text-[10px] text-zinc-500 truncate w-full text-left">{m.user.email}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="group relative flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all cursor-pointer" onClick={() => setShowAssigneePicker(true)}>
                      {currentIssue.assignee ? (
                        <div className="flex items-center gap-3">
                          {currentIssue.assignee.image ? (
                            <img src={currentIssue.assignee.image} alt="" className="w-10 h-10 rounded-full border-2 border-white/5 shadow-xl" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center text-xs font-bold text-accent-400 border border-accent-500/20 shadow-xl">
                              {(currentIssue.assignee.name || currentIssue.assignee.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-zinc-200 truncate">{currentIssue.assignee.name || 'Developer'}</span>
                            <span className="text-[11px] text-zinc-500 truncate">{currentIssue.assignee.email}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-zinc-500 italic text-xs py-1">
                          <div className="w-10 h-10 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-zinc-700 font-mono">?</div>
                          No assignee set
                        </div>
                      )}
                      
                      {!isAssignedToMe && !currentIssue.assignee && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateField({ assignedTo: session?.backendUserId }); }}
                          className="text-[10px] bg-accent-500 text-zinc-950 font-bold px-2.5 py-1 rounded-lg hover:bg-accent-400 transition-colors shadow-lg shadow-accent-500/10"
                        >
                          Assign Me
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Due Date Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due Date
                  </div>
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1 pr-2">
                    <input
                      type="date"
                      value={currentIssue.dueDate ? new Date(currentIssue.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleUpdateField({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="flex-1 bg-transparent border-none rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-0 [color-scheme:dark]"
                    />
                    {currentIssue.dueDate && (
                      <button 
                        onClick={() => handleUpdateField({ dueDate: null })}
                        className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {currentIssue.dueDate && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg w-fit text-[10px] font-bold uppercase tracking-wide ${
                      isOverdue ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-white/5'
                    }`}>
                      {isOverdue ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isOverdue ? 'Overdue' : 'Remaining'}: {Math.ceil(Math.abs(new Date(currentIssue.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                    </div>
                  )}
                </div>

                {/* Labels Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Labels
                    </div>
                    <button 
                      onClick={() => setShowLabelPicker(!showLabelPicker)}
                      className="text-[10px] text-accent-400 hover:text-accent-300 font-medium bg-accent-500/5 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {showLabelPicker ? 'Close' : 'Manage'}
                    </button>
                  </div>
                  
                  {showLabelPicker ? (
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.06] backdrop-blur-md shadow-2xl">
                      {projectLabels.map(label => (
                        <button
                          key={label.id}
                          onClick={() => handleToggleLabel(label.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                            currentIssue.labels?.includes(label.id)
                              ? 'bg-white/10 border-white/20 text-white shadow-lg shadow-black/20'
                              : 'bg-transparent border-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                          }`}
                          style={currentIssue.labels?.includes(label.id) ? { color: label.color, backgroundColor: `${label.color}15`, borderColor: `${label.color}30` } : {}}
                        >
                          {label.name}
                        </button>
                      ))}
                      {projectLabels.length === 0 && (
                        <p className="text-zinc-600 italic text-[10px] w-full text-center py-2">No labels available in project</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {currentIssue.labelDetails?.length > 0 ? (
                        currentIssue.labelDetails.map((l: any) => (
                          <span 
                            key={l.id} 
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                            style={{ backgroundColor: `${l.color}15`, color: l.color, borderColor: `${l.color}30` }}
                          >
                            {l.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-zinc-600 italic">No labels assigned</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Section */}
              <div className="pt-8 border-t border-white/[0.04] space-y-4">
                <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04] space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-600 uppercase font-bold tracking-widest">Reporter</span>
                    <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold">
                        {(currentIssue.creator.name || currentIssue.creator.email)[0].toUpperCase()}
                      </div>
                      {currentIssue.creator.name || currentIssue.creator.email.split('@')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-600 uppercase font-bold tracking-widest">Created</span>
                    <span className="text-zinc-400 font-medium">{new Date(currentIssue.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-600 uppercase font-bold tracking-widest">Updated</span>
                    <span className="text-zinc-400 font-medium">{new Date(currentIssue.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[1px] flex items-center justify-center z-[60]">
            <PageLoader size="sm" />
          </div>
        )}
      </div>
    </>
  );
}
