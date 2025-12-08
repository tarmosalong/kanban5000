'use client';

import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: ReactNode;
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col flex-shrink-0 w-72 rounded-xl transition-all duration-300
        ${isOver 
          ? 'ring-2 ring-primary-500/40 bg-primary-500/5' 
          : 'bg-white/[0.02]'
        }
      `}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-white/[0.06]">
        <div
          className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-transparent"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}50`
          }}
        />
        <span className="font-medium text-sm text-slate-200">{title}</span>
        <span className="ml-auto text-xs text-slate-500 bg-white/[0.06] px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
      </div>

      {/* Column Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}
