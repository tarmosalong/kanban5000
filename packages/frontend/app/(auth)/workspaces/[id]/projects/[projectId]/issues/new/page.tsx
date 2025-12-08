'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';

interface IssueStatus {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

export default function NewIssuePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [statusId, setStatusId] = useState('');
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatuses();
  }, [projectId]);

  async function fetchStatuses() {
    try {
      const res = await fetch(`/api/projects/${projectId}/statuses`);
      const data = await res.json();
      setStatuses(data.data || []);
      
      // Set default status
      const defaultStatus = data.data?.find((s: IssueStatus) => s.isDefault);
      if (defaultStatus) {
        setStatusId(defaultStatus.id);
      } else if (data.data?.length > 0) {
        setStatusId(data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          statusId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create issue');
      }

      router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Create Issue</h1>

      <Card className="p-6 bg-surface-card border-white/[0.06]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this issue..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none font-mono text-sm"
              rows={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id} className="bg-surface text-white">
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value} className="bg-surface text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
