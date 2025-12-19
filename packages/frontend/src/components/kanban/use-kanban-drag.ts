'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import type { Issue, Column } from './types';

export function useKanbanDrag(
  initialIssues: Issue[],
  statuses: { id: string; name: string; color: string }[],
  onIssueMove: (id: string, statusId: string, pos: number) => Promise<void>
) {
  const [localIssues, setLocalIssues] = useState(initialIssues);
  const [dragState, setDragState] = useState<{
    activeId: string | null;
    activeColumnId: string | null;
    overColumnId: string | null;
    overIndex: number;
  }>({ activeId: null, activeColumnId: null, overColumnId: null, overIndex: 0 });

  // Sünkroniseeri localIssues kui props muutuvad (v.a lohistamise ajal)
  useEffect(() => {
    if (!dragState.activeId) {
      setLocalIssues(initialIssues);
    }
  }, [initialIssues, dragState.activeId]);

  const columns = useMemo(() => {
    return statuses.map(status => {
      const columnIssues = localIssues
        .filter(i => i.status.id === status.id)
        .sort((a, b) => a.position - b.position);
      
      return {
        id: status.id,
        name: status.name,
        color: status.color,
        issues: columnIssues
      };
    });
  }, [localIssues, statuses]);

  const getIssue = useCallback((id: string) => localIssues.find(i => i.id === id), [localIssues]);
  const getColumnId = useCallback((issueId: string) => {
    return localIssues.find(i => i.id === issueId)?.status.id;
  }, [localIssues]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);
    const activeColumnId = getColumnId(activeId) || null;
    const columnIssues = localIssues
      .filter(i => i.status.id === activeColumnId)
      .sort((a, b) => a.position - b.position);
    const index = columnIssues.findIndex(i => i.id === activeId);

    setDragState({
      activeId,
      activeColumnId,
      overColumnId: activeColumnId,
      overIndex: index >= 0 ? index : 0,
    });
    document.body.style.cursor = 'grabbing';
  }, [localIssues, getColumnId]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;

    setDragState(prev => {
      if (!prev.activeId) return prev;

      const overId = String(over.id);
      let targetColumnId: string;
      let targetIndex: number;

    if (overId.startsWith('bottom:') || overId.startsWith('column:') || overId.startsWith('empty:')) {
      if (overId.startsWith('bottom:')) {
        const parts = overId.split(':');
        targetColumnId = parts[1];
        targetIndex = parseInt(parts[2], 10);
      } else if (overId.startsWith('column:')) {
        targetColumnId = overId.replace('column:', '');
        const col = columns.find(c => c.id === targetColumnId);
        targetIndex = col ? col.issues.length : 0;
      } else {
        targetColumnId = overId.replace('empty:', '');
        targetIndex = 0;
      }
    } else {
        const columnId = getColumnId(overId);
        if (!columnId) return prev;
        targetColumnId = columnId;
        const columnIssues = localIssues
          .filter(i => i.status.id === columnId)
          .sort((a, b) => a.position - b.position);
        targetIndex = columnIssues.findIndex(i => i.id === overId);
        if (targetIndex === -1) return prev;
      }

      if (prev.overColumnId !== targetColumnId || prev.overIndex !== targetIndex) {
        return {
          ...prev,
          overColumnId: targetColumnId,
          overIndex: targetIndex,
        };
      }
      return prev;
    });
  }, [localIssues, getColumnId]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { activeId, activeColumnId, overColumnId, overIndex } = dragState;
    setDragState({ activeId: null, activeColumnId: null, overColumnId: null, overIndex: 0 });
    document.body.style.cursor = '';

    if (!activeId || !activeColumnId || !overColumnId) return;

    const activeIssue = getIssue(activeId);
    if (!activeIssue) return;

    let finalPosition = overIndex;
    
    // Optimistlik uuendus kohalikus states
    setLocalIssues(prev => {
      const columnIssues = prev
        .filter(i => i.status.id === (activeColumnId === overColumnId ? activeColumnId : overColumnId))
        .sort((a, b) => a.position - b.position);
      
      if (activeColumnId === overColumnId) {
        const oldIdx = columnIssues.findIndex(i => i.id === activeId);
        const insertIdx = overIndex > oldIdx ? overIndex - 1 : overIndex;
        finalPosition = Math.max(0, Math.min(insertIdx, columnIssues.length - 1));
      } else {
        finalPosition = Math.min(overIndex, columnIssues.length);
      }

      return prev.map(i => {
        if (i.id === activeId) {
          return { ...i, status: { ...i.status, id: overColumnId } };
        }
        return i;
      });
    });

    try {
      await onIssueMove(activeId, overColumnId, finalPosition);
    } catch (error) {
      // Revert to current props on error
      setLocalIssues(prev => prev);
    }
  }, [dragState, getIssue, onIssueMove]);

  const handleDragCancel = useCallback(() => {
    setDragState({ activeId: null, activeColumnId: null, overColumnId: null, overIndex: 0 });
    document.body.style.cursor = '';
  }, []);

  return {
    columns,
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    activeIssue: dragState.activeId ? getIssue(dragState.activeId) : null,
  };
}

