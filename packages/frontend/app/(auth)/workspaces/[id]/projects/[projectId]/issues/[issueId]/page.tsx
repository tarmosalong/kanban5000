'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';

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

const PRIORITY_LABELS = {
  low: { label: 'Low', color: 'bg-gray-500/20 text-gray-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-400' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/20 text-red-400' },
};

export default function IssuePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;
  const issueId = params.issueId as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [issueId]);

  async function fetchData() {
    try {
      const [issueRes, commentsRes, statusesRes] = await Promise.all([
        fetch(`/api/issues/${issueId}`),
        fetch(`/api/issues/${issueId}/comments`),
        fetch(`/api/projects/${projectId}/statuses`),
      ]);

      const issueData = await issueRes.json();
      const commentsData = await commentsRes.json();
      const statusesData = await statusesRes.json();

      setIssue(issueData.data);
      setComments(commentsData.data || []);
      setStatuses(statusesData.data || []);
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
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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

  const priorityInfo = PRIORITY_LABELS[issue.priority];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link
          href={`/workspaces/${workspaceId}/projects/${projectId}`}
          className="hover:text-white"
        >
          ← Back to board
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-gray-500 font-mono">#{issue.number}</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${priorityInfo.color}`}
          >
            {priorityInfo.label}
          </span>
        </div>
        <h1 className="text-3xl font-bold">{issue.title}</h1>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-sm font-medium text-gray-400 mb-3">
              Description
            </h2>
            {issue.description ? (
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                {issue.description}
              </div>
            ) : (
              <p className="text-gray-500 italic">No description provided</p>
            )}
          </Card>

          {/* Comments */}
          <Card className="p-6">
            <h2 className="text-sm font-medium text-gray-400 mb-4">
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
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                      {(comment.author.name || comment.author.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.author.name || comment.author.email}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {comment.editedAt && (
                        <span className="text-gray-500 text-xs">(edited)</span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No comments yet
                </p>
              )}
            </div>

            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-2 bg-surface-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  size="sm"
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
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
            <select
              value={issue.status.id}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Assignee</h3>
            {issue.assignee ? (
              <div className="flex items-center gap-2">
                {issue.assignee.image ? (
                  <img
                    src={issue.assignee.image}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                    {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm">
                  {issue.assignee.name || issue.assignee.email}
                </span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Unassigned</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Created</h3>
            <p className="text-sm">
              {new Date(issue.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              by {issue.creator.name || issue.creator.email}
            </p>
          </Card>

          {issue.closedAt && (
            <Card className="p-4 border-green-500/30">
              <h3 className="text-sm font-medium text-green-400 mb-2">
                Closed
              </h3>
              <p className="text-sm">
                {new Date(issue.closedAt).toLocaleDateString()}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

