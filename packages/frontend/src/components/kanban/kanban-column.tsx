'use client';

import { useDroppable } from '@dnd-kit/core';
import { useState, useRef, useEffect, type ReactNode } from 'react';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: ReactNode;
  onQuickCreate?: (title: string, statusId: string) => Promise<void>;
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
  onQuickCreate,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleSubmit = async () => {
    if (!newTitle.trim() || !onQuickCreate) return;
    
    setIsSubmitting(true);
    try {
      await onQuickCreate(newTitle.trim(), id);
      setNewTitle('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create issue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTitle('');
    }
  };

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
        <span className="text-xs text-slate-500 bg-white/[0.06] px-2 py-0.5 rounded-full font-medium">
          {count}
        </span>
        
        {/* Quick Add Button */}
        {onQuickCreate && (
          <button
            onClick={() => setIsCreating(true)}
            className="ml-auto p-1 text-slate-500 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Quick add issue"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* Quick Create Form */}
      {isCreating && (
        <div className="p-2 border-b border-white/[0.06]">
          <div className="bg-surface-card rounded-lg p-3 border border-white/10">
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Issue title..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] text-slate-500">
                Enter to save · Esc to cancel
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewTitle('');
                  }}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!newTitle.trim() || isSubmitting}
                  className="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Content - scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}
