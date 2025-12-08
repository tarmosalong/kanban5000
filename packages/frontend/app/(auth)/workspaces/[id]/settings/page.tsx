'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button, Input, Card } from '@/components/ui';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const response = await fetch(`/api/workspaces/${params.id}`);
        if (!response.ok) throw new Error('Failed to load workspace');
        const data = await response.json();
        setWorkspace(data.data);
        setName(data.data.name);
        setDescription(data.data.description || '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load workspace');
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspace();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/workspaces/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update workspace');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
        Workspace not found
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
        <Link href="/workspaces" className="hover:text-slate-900 dark:hover:text-white">
          Workspaces
        </Link>
        <span>/</span>
        <Link href={`/workspaces/${workspace.id}`} className="hover:text-slate-900 dark:hover:text-white">
          {workspace.name}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">Settings</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage workspace configuration
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-green-600 dark:text-green-400 text-sm">
              Settings saved successfully
            </div>
          )}

          <Input
            label="Workspace name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workspace"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              URL slug
            </label>
            <input
              type="text"
              value={workspace.slug}
              disabled
              className="input opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">
              Slug cannot be changed after creation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px]"
              placeholder="What is this workspace for?"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

