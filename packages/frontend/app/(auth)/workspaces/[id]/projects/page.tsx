'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';

interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  isArchived: boolean;
  createdAt: string;
}

export default function ProjectsPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [workspaceId]);

  async function fetchProjects() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="p-6 border-red-500/30 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-400 mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href={`/workspaces/${workspaceId}/projects/new`}>
          <Button>Create Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-gray-400 mb-6">
            Create your first project to start tracking issues
          </p>
          <Link href={`/workspaces/${workspaceId}/projects/new`}>
            <Button>Create First Project</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/workspaces/${workspaceId}/projects/${project.id}`}
            >
              <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      {project.slug}
                    </p>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

