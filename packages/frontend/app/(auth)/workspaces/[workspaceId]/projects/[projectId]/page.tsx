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
}

interface IssueStatus {
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
  status: IssueStatus;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  createdAt: string;
}

interface StatusGroup {
  status: IssueStatus;
  issues: Issue[];
}

const PRIORITY_COLORS = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export default function ProjectPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  async function fetchData() {
    try {
      const [projectRes, statusesRes, issuesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/statuses`),
        fetch(`/api/projects/${projectId}/issues?includeClosed=true`),
      ]);

      const projectData = await projectRes.json();
      const statusesData = await statusesRes.json();
      const issuesData = await issuesRes.json();

      setProject(projectData.data);

      // Group issues by status
      const statuses = statusesData.data || [];
      const issues = issuesData.data || [];

      const groups: StatusGroup[] = statuses.map((status: IssueStatus) => ({
        status,
        issues: issues.filter((issue: Issue) => issue.status.id === status.id),
      }));

      setStatusGroups(groups);
    } catch (err) {
      console.error('Failed to fetch project data:', err);
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

  if (!project) {
    return (
      <div className="p-8">
        <Card className="p-6 border-red-500/30 bg-red-500/10">
          <p className="text-red-400">Project not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-gray-400 mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/workspaces/${workspaceId}/projects/${projectId}/issues/new`}
          >
            <Button>New Issue</Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusGroups.map(({ status, issues }) => (
          <div
            key={status.id}
            className="flex-shrink-0 w-80"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="font-medium">{status.name}</span>
              <span className="text-gray-500 text-sm">({issues.length})</span>
            </div>

            <div className="space-y-2">
              {issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/workspaces/${workspaceId}/projects/${projectId}/issues/${issue.id}`}
                >
                  <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 text-sm font-mono">
                        #{issue.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {issue.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[issue.priority]}`}
                            title={issue.priority}
                          />
                          {issue.assignee && (
                            <div className="flex items-center gap-1">
                              {issue.assignee.image ? (
                                <img
                                  src={issue.assignee.image}
                                  alt=""
                                  className="w-5 h-5 rounded-full"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                                  {(issue.assignee.name || issue.assignee.email)[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
              
              {issues.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No issues
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

