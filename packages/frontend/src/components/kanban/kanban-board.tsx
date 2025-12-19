'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

import { IssueCard } from './issue-card';
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

// Draggable issue card
function DraggableIssue({ 
  issue, 
  workspaceId, 
  projectId,
  projectKey,
  isDragging,
  onIssueClick,
}: { 
  issue: Issue; 
  workspaceId: string; 
  projectId: string;
  projectKey: string;
  isDragging: boolean;
  onIssueClick?: (issue: Issue) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: issue.id });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing touch-none ${isDragging ? 'opacity-30' : ''}`}
    >
      <IssueCard issue={issue} workspaceId={workspaceId} projectId={projectId} projectKey={projectKey} onClick={onIssueClick} />
    </div>
  );
}

// Droppable zone for each issue (for reordering)
function DroppableIssueZone({ issueId, children }: { issueId: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: issueId });

  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  );
}

// Droppable column
function DroppableColumn({ 
  columnId, 
  children, 
  isActive,
  issueCount,
}: { 
  columnId: string; 
  children: React.ReactNode; 
  isActive: boolean;
  issueCount: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${columnId}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-2 space-y-1.5 overflow-y-auto min-h-[200px] rounded-lg transition-colors duration-150 ${
        isOver || isActive ? 'bg-accent-500/5' : ''
      }`}
    >
      {children}
      {/* Bottom drop zone for "add to end" */}
      <BottomDropZone columnId={columnId} index={issueCount} />
    </div>
  );
}

// Drop zone at bottom of column
function BottomDropZone({ columnId, index }: { columnId: string; index: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `bottom:${columnId}:${index}` });

  return (
    <div 
      ref={setNodeRef} 
      className={`min-h-[40px] rounded-lg transition-all duration-150 ${
        isOver ? 'bg-accent-500/10 border border-dashed border-accent-500/30' : ''
      }`}
    />
  );
}

// Placeholder card shown during drag
function PlaceholderCard({ issue, projectKey }: { issue: Issue; projectKey: string }) {
  return (
    <div className="rounded-lg border border-dashed border-accent-500/40 bg-accent-500/10 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-accent-400/60 text-[11px] font-mono">{projectKey}-{issue.number}</span>
      </div>
      <div className="text-[13px] font-medium text-accent-300/80 leading-snug line-clamp-2">
        {issue.title}
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
  
  // Build columns from statuses and issues
  const buildColumns = (): Column[] => {
    return statuses.map(status => ({
      id: status.id,
      name: status.name,
      color: status.color,
      issues: issues
        .filter(i => i.status.id === status.id)
        .sort((a, b) => a.position - b.position),
    }));
  };
  
  const [columns, setColumns] = useState<Column[]>(buildColumns);

  // Simple drag state
  const [dragState, setDragState] = useState<{
    activeId: string | null;
    activeColumnId: string | null;
    overColumnId: string | null;
    overIndex: number;
  }>({ activeId: null, activeColumnId: null, overColumnId: null, overIndex: 0 });

  const lastOverRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync columns when issues prop changes
  useEffect(() => {
    setColumns(buildColumns());
  }, [issues, statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function getIssue(issueId: string): Issue | null {
    for (const col of columns) {
      const issue = col.issues.find(i => i.id === issueId);
      if (issue) return issue;
    }
    return null;
  }

  function getColumnId(issueId: string): string | null {
    for (const col of columns) {
      if (col.issues.some(i => i.id === issueId)) return col.id;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const issueId = String(event.active.id);
    const columnId = getColumnId(issueId);
    const column = columns.find(c => c.id === columnId);
    const index = column?.issues.findIndex(i => i.id === issueId) ?? 0;

    setDragState({
      activeId: issueId,
      activeColumnId: columnId,
      overColumnId: columnId,
      overIndex: index,
    });
    lastOverRef.current = null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;

    if (!over || !dragState.activeId) return;

    const overId = String(over.id);

    // Skip duplicate events
    if (lastOverRef.current === overId) return;
    lastOverRef.current = overId;

    let targetColumnId: string;
    let targetIndex: number;

    if (overId.startsWith('bottom:')) {
      // Dropping at bottom of column
      const parts = overId.split(':');
      targetColumnId = parts[1];
      targetIndex = parseInt(parts[2], 10);
    } else if (overId.startsWith('column:')) {
      // Dropping on column (empty area)
      targetColumnId = overId.replace('column:', '');
      const column = columns.find(c => c.id === targetColumnId);
      targetIndex = column ? column.issues.length : 0;
    } else {
      // Dropping on another issue - just get the index, no adjustment
      const columnId = getColumnId(overId);
      if (!columnId) return;
      targetColumnId = columnId;
      const column = columns.find(c => c.id === columnId);
      targetIndex = column?.issues.findIndex(i => i.id === overId) ?? 0;
    }

    if (dragState.overColumnId !== targetColumnId || dragState.overIndex !== targetIndex) {
      setDragState(prev => ({
        ...prev,
        overColumnId: targetColumnId,
        overIndex: targetIndex,
      }));
    }
  }

  async function handleDragEnd() {
    const { activeId, activeColumnId, overColumnId, overIndex } = dragState;

    setDragState({ activeId: null, activeColumnId: null, overColumnId: null, overIndex: 0 });
    lastOverRef.current = null;

    if (!activeId || !activeColumnId || !overColumnId) return;

    const activeIssue = getIssue(activeId);
    if (!activeIssue) return;

    let newColumns: Column[];

    if (activeColumnId === overColumnId) {
      // Reorder within same column
      newColumns = columns.map(col => {
        if (col.id !== activeColumnId) return col;

        const colIssues = [...col.issues];
        const currentIndex = colIssues.findIndex(i => i.id === activeId);
        if (currentIndex === -1 || currentIndex === overIndex) return col;

        const [removed] = colIssues.splice(currentIndex, 1);
        // When dragging down, account for the removed item
        const newIndex = overIndex > currentIndex ? overIndex - 1 : overIndex;
        colIssues.splice(Math.max(0, Math.min(newIndex, colIssues.length)), 0, removed);

        return { ...col, issues: colIssues };
      });
    } else {
      // Move to different column
      const targetStatus = statuses.find(s => s.id === overColumnId);
      if (!targetStatus) return;

      newColumns = columns.map(col => {
        if (col.id === activeColumnId) {
          return { ...col, issues: col.issues.filter(i => i.id !== activeId) };
        }
        if (col.id === overColumnId) {
          const colIssues = [...col.issues];
          const movedIssue = {
            ...activeIssue,
            status: { id: targetStatus.id, name: targetStatus.name, color: targetStatus.color },
          };
          colIssues.splice(Math.min(overIndex, colIssues.length), 0, movedIssue);
          return { ...col, issues: colIssues };
        }
        return col;
      });
    }

    setColumns(newColumns);

    // Calculate position for backend
    const targetColumn = newColumns.find(c => c.id === overColumnId);
    const finalPosition = targetColumn?.issues.findIndex(i => i.id === activeId) ?? 0;

    // Persist to backend
    try {
      await onIssueMove(activeId, overColumnId, finalPosition);
    } catch (error) {
      // Revert on error
      setColumns(buildColumns());
    }
  }

  function handleDragCancel() {
    setDragState({ activeId: null, activeColumnId: null, overColumnId: null, overIndex: 0 });
    lastOverRef.current = null;
  }

  const draggedIssue = dragState.activeId ? getIssue(dragState.activeId) : null;

  // Render issues with placeholder
  function renderIssues(column: Column) {
    const { activeId, activeColumnId, overColumnId, overIndex } = dragState;
    const isSourceColumn = activeColumnId === column.id;
    const isTargetColumn = overColumnId === column.id;
    const activeIssue = activeId ? getIssue(activeId) : null;

    const items: React.ReactNode[] = [];

    column.issues.forEach((issue, index) => {
      const isDragging = issue.id === activeId;

      // Show placeholder BEFORE this issue when:
      // - This is the target column
      // - This is NOT the source column (different column drop)
      // - We're at the overIndex position
      if (isTargetColumn && !isSourceColumn && index === overIndex && activeIssue) {
        items.push(
          <PlaceholderCard key="placeholder" issue={activeIssue} projectKey={projectKey} />
        );
      }

      items.push(
        <DroppableIssueZone key={issue.id} issueId={issue.id}>
          <DraggableIssue
            issue={issue}
            workspaceId={workspaceId}
            projectId={projectId}
            projectKey={projectKey}
            isDragging={isDragging}
            onIssueClick={onIssueClick}
          />
        </DroppableIssueZone>
      );
    });

    // Placeholder at end of different column
    if (isTargetColumn && !isSourceColumn && overIndex >= column.issues.length && activeIssue) {
      items.push(
        <PlaceholderCard key="placeholder" issue={activeIssue} projectKey={projectKey} />
      );
    }

    return items;
  }

  if (!mounted) {
    return (
      <div className="flex gap-3 h-full">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col flex-shrink-0 w-72 rounded-xl bg-zinc-900/30">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04]">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span className="font-medium text-[13px] text-zinc-300">{column.name}</span>
              <span className="text-[11px] text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded-md ml-auto">
                {column.issues.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[100px]">
              {column.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} workspaceId={workspaceId} projectId={projectId} projectKey={projectKey} onClick={onIssueClick} />
              ))}
            </div>
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
          const isActive = dragState.overColumnId === column.id;

          return (
            <div
              key={column.id}
              className={`flex flex-col flex-shrink-0 w-72 rounded-xl transition-all duration-150 ${
                isActive ? 'bg-accent-500/5 ring-1 ring-accent-500/20' : 'bg-zinc-900/30'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04]">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="font-medium text-[13px] text-zinc-300">{column.name}</span>
                <span className="text-[11px] text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded-md ml-auto">
                  {column.issues.length}
                </span>

                {/* Quick Add Button */}
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

              <DroppableColumn columnId={column.id} isActive={isActive} issueCount={column.issues.length}>
                {renderIssues(column)}

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

      <DragOverlay>
        {draggedIssue && (
          <div className="w-72 rotate-1 scale-105 shadow-2xl">
            <IssueCard issue={draggedIssue} workspaceId={workspaceId} projectId={projectId} projectKey={projectKey} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
