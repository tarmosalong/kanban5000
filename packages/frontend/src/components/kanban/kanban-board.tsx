'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { IssueCard } from './issue-card';
import { DraggableIssue, DroppableIssueZone, DroppableColumn } from './kanban-components';
import { useKanbanDrag } from './use-kanban-drag';
import type { Issue, IssueStatus, Column } from './types';

export type { Issue, IssueStatus } from './types';

interface KanbanBoardProps {
  statuses: IssueStatus[];
  issues: Issue[];
  workspaceId: string;
  projectId: string;
  projectKey: string;
  onIssueMove: (issueId: string, newStatusId: string, position: number) => Promise<void>;
  onQuickCreate?: (title: string, statusId: string) => Promise<void>;
  onIssueClick?: (issue: Issue) => void;
}

// Placeholder card shown during drag
function PlaceholderCard({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  return (
    <div className="w-full rounded-lg border-2 border-dashed border-accent-500/30 bg-accent-500/5 min-h-[100px] p-3 animate-pulse pointer-events-none">
      <div className="flex items-center justify-between mb-2 opacity-20">
        <span className="text-[11px] font-mono">{projectKey}-{issue.number}</span>
      </div>
      <div className="space-y-2 opacity-10">
        <div className="h-3 w-3/4 bg-white/20 rounded" />
        <div className="h-3 w-1/2 bg-white/20 rounded" />
      </div>
    </div>
  );
}

export function KanbanBoard({
  statuses,
  issues,
  workspaceId,
  projectId,
  projectKey,
  onIssueMove,
  onQuickCreate,
  onIssueClick,
}: KanbanBoardProps) {
  const [mounted, setMounted] = useState(false);
  
  const {
    columns,
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    activeIssue
  } = useKanbanDrag(issues, statuses, onIssueMove);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Render issues with placeholder logic - MUST be before early return
  const renderIssuesInColumn = useCallback((column: Column) => {
    const { activeId, activeColumnId, overColumnId, overIndex } = dragState;
    
    if (!activeIssue) {
      return column.issues.map((issue) => (
        <DroppableIssueZone key={issue.id} issueId={issue.id}>
          <DraggableIssue
            issue={issue}
            workspaceId={workspaceId}
            projectId={projectId}
            projectKey={projectKey}
            isDragging={false}
            onIssueClick={onIssueClick}
          />
        </DroppableIssueZone>
      ));
    }

    const isSourceColumn = activeColumnId === column.id;
    const isTargetColumn = overColumnId === column.id;
    
    let displayIssues = [...column.issues];
    if (isSourceColumn) {
      displayIssues = displayIssues.filter(i => i.id !== activeId);
    }
    
    if (isTargetColumn) {
      const placeholder = { ...activeIssue, id: 'placeholder-internal' } as any;
      displayIssues.splice(Math.min(overIndex, displayIssues.length), 0, placeholder);
    }

    return displayIssues.map((issue) => {
      if (issue.id === 'placeholder-internal') {
        return <PlaceholderCard key="placeholder" issue={activeIssue} projectKey={projectKey} />;
      }

      return (
        <DroppableIssueZone key={issue.id} issueId={issue.id}>
          <DraggableIssue
            issue={issue}
            workspaceId={workspaceId}
            projectId={projectId}
            projectKey={projectKey}
            isDragging={issue.id === activeId}
            onIssueClick={onIssueClick}
          />
        </DroppableIssueZone>
      );
    });
  }, [dragState, activeIssue, workspaceId, projectId, projectKey, onIssueClick]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-3 h-full">
        {statuses.map((status) => (
          <div key={status.id} className="flex flex-col flex-shrink-0 w-72 rounded-xl bg-zinc-900/30">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="font-medium text-[13px] text-zinc-300">{status.name}</span>
            </div>
            <div className="flex-1 p-2 space-y-1.5 min-h-[100px]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 h-full">
        {columns.map((column) => {
          const isOverColumn = dragState.overColumnId === column.id;

          return (
            <div
              key={column.id}
              className={`flex flex-col flex-shrink-0 w-72 rounded-xl bg-zinc-900/30 border transition-all duration-150 ${
                isOverColumn ? 'border-accent-500/30 ring-1 ring-accent-500/10' : 'border-white/[0.04]'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                <span className="font-medium text-[13px] text-zinc-300">{column.name}</span>
                <span className="text-[11px] text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded-md ml-auto">
                  {column.issues.length}
                </span>

                {onQuickCreate && (
                  <button
                    onClick={() => {
                      const title = prompt('Issue title:');
                      if (title) onQuickCreate(title, column.id);
                    }}
                    className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06] rounded transition-colors"
                    title="Quick add issue"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>

              <DroppableColumn columnId={column.id} issueCount={column.issues.length}>
                {renderIssuesInColumn(column)}

                {column.issues.length === 0 && !dragState.activeId && (
                  <div className="flex items-center justify-center h-20 text-[12px] text-zinc-700 border border-dashed border-white/[0.06] rounded-lg">
                    Drop issues here
                  </div>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue && (
          <div className="w-72 scale-[1.02] shadow-2xl shadow-black/40 rotate-1 pointer-events-none">
            <IssueCard issue={activeIssue} workspaceId={workspaceId} projectId={projectId} projectKey={projectKey} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
