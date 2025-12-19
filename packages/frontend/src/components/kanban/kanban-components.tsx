'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { IssueCard } from './issue-card';
import type { Issue } from './types';

// Draggable issue card
export function DraggableIssue({ 
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
export function DroppableIssueZone({ issueId, children }: { issueId: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: issueId });

  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  );
}

// Droppable column
export function DroppableColumn({ 
  columnId, 
  children, 
  issueCount,
}: { 
  columnId: string; 
  children: React.ReactNode; 
  issueCount: number;
}) {
  const { setNodeRef } = useDroppable({ id: `column:${columnId}` });

  return (
    <div
      ref={setNodeRef}
      className="flex-1 p-2 space-y-1.5 overflow-y-auto min-h-[200px] relative flex flex-col"
    >
      <div className="flex-1 space-y-1.5 z-10">
        {children}
      </div>
      {/* Bottom drop zone for "add to end" - invisible but easy to catch */}
      <BottomDropZone columnId={columnId} index={issueCount} />
    </div>
  );
}

// Drop zone at bottom of column - functional but invisible
function BottomDropZone({ columnId, index }: { columnId: string; index: number }) {
  const { setNodeRef } = useDroppable({ id: `bottom:${columnId}:${index}` });

  return (
    <div 
      ref={setNodeRef} 
      className="h-24 w-full absolute bottom-0 left-0 z-0" 
    />
  );
}

