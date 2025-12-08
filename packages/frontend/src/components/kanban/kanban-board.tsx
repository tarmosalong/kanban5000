'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { IssueCard } from './issue-card';

export interface IssueStatus {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface Issue {
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
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  labelDetails: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  createdAt: string;
}

interface KanbanBoardProps {
  statuses: IssueStatus[];
  issues: Issue[];
  workspaceId: string;
  projectId: string;
  onIssueMove: (issueId: string, newStatusId: string) => Promise<void>;
  onQuickCreate?: (title: string, statusId: string) => Promise<void>;
}

export function KanbanBoard({
  statuses,
  issues,
  workspaceId,
  projectId,
  onIssueMove,
  onQuickCreate,
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [localIssues, setLocalIssues] = useState(issues);

  // Sync local state when issues prop changes
  useMemo(() => {
    setLocalIssues(issues);
  }, [issues]);

  // Group issues by status
  const issuesByStatus = useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    statuses.forEach((status) => {
      grouped[status.id] = localIssues.filter(
        (issue) => issue.status.id === status.id
      );
    });
    return grouped;
  }, [localIssues, statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const issue = localIssues.find((i) => i.id === active.id);
    if (issue) {
      setActiveIssue(issue);
      document.body.style.cursor = 'grabbing';
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeIssueId = active.id as string;
    const overId = over.id as string;

    const overStatus = statuses.find((s) => s.id === overId);
    const overIssue = localIssues.find((i) => i.id === overId);

    const activeIssue = localIssues.find((i) => i.id === activeIssueId);
    if (!activeIssue) return;

    let newStatusId: string | null = null;

    if (overStatus) {
      newStatusId = overStatus.id;
    } else if (overIssue) {
      newStatusId = overIssue.status.id;
    }

    if (newStatusId && newStatusId !== activeIssue.status.id) {
      setLocalIssues((prev) =>
        prev.map((issue) =>
          issue.id === activeIssueId
            ? {
                ...issue,
                status: {
                  ...issue.status,
                  id: newStatusId!,
                  name: statuses.find((s) => s.id === newStatusId)?.name || issue.status.name,
                  color: statuses.find((s) => s.id === newStatusId)?.color || issue.status.color,
                },
              }
            : issue
        )
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveIssue(null);
    document.body.style.cursor = '';

    if (!over) return;

    const activeIssueId = active.id as string;
    const overId = over.id as string;

    const overStatus = statuses.find((s) => s.id === overId);
    const overIssue = localIssues.find((i) => i.id === overId);

    let targetStatusId: string | null = null;

    if (overStatus) {
      targetStatusId = overStatus.id;
    } else if (overIssue) {
      targetStatusId = overIssue.status.id;
    }

    if (targetStatusId) {
      const activeIssue = issues.find((i) => i.id === activeIssueId);
      if (activeIssue && activeIssue.status.id !== targetStatusId) {
        try {
          await onIssueMove(activeIssueId, targetStatusId);
        } catch (error) {
          setLocalIssues(issues);
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 h-full">
        {statuses.map((status) => (
          <KanbanColumn
            key={status.id}
            id={status.id}
            title={status.name}
            color={status.color}
            count={issuesByStatus[status.id]?.length || 0}
            onQuickCreate={onQuickCreate}
          >
            <SortableContext
              items={issuesByStatus[status.id]?.map((i) => i.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {issuesByStatus[status.id]?.map((issue) => (
                <KanbanCard key={issue.id} id={issue.id}>
                  <IssueCard
                    issue={issue}
                    workspaceId={workspaceId}
                    projectId={projectId}
                  />
                </KanbanCard>
              ))}
              {issuesByStatus[status.id]?.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-slate-600 border border-dashed border-white/[0.06] rounded-lg">
                  Drop issues here
                </div>
              )}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeIssue ? (
          <div className="opacity-95">
            <IssueCard
              issue={activeIssue}
              workspaceId={workspaceId}
              projectId={projectId}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
