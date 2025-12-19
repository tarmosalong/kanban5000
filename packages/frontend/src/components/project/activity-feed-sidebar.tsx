'use client';

import { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from '../ui/loading';
import { getProjectKey } from '@/lib/issue-key';

interface ActivityEntry {
  id: string;
  issueId: string;
  userId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  issue?: {
    id: string;
    title: string;
    number: number;
  };
}

interface ActivityFeedSidebarProps {
  projectId: string;
  projectSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityFeedSidebar({ projectId, projectSlug, isOpen, onClose }: ActivityFeedSidebarProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const projectKey = getProjectKey(projectSlug);

  useEffect(() => {
    if (isOpen) {
      fetchActivity();
    }
  }, [isOpen, projectId]);

  async function fetchActivity() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch project activity:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[40] transition-all animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-full w-80 bg-zinc-900 border-l border-white/[0.06] shadow-2xl z-[50] transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-[14px] font-semibold text-white tracking-tight">Recent Activity</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner className="w-6 h-6" />
            </div>
          ) : activities.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4 text-zinc-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-12 0 9 9 0 0112 0z" />
                </svg>
              </div>
              <p className="text-[13px] text-zinc-500">No activity yet in this project.</p>
            </div>
          ) : (
            <div className="p-4 space-y-6 relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[33px] top-6 bottom-6 w-[1px] bg-white/[0.04]" />

              {activities.map((activity, idx) => (
                <div key={activity.id} className="relative flex gap-4 group animate-in slide-in-from-right-2" style={{ animationDelay: `${idx * 30}ms` }}>
                  {/* Icon Circle */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-zinc-800 border border-white/[0.04] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:border-accent-500/20 transition-colors">
                    {getActivityIcon(activity.action, activity.fieldName)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 pt-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-white truncate">
                        {activity.user?.name || activity.user?.email?.split('@')[0] || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono flex-shrink-0">
                        {formatTime(activity.createdAt)}
                      </span>
                    </div>
                    <div className="text-[12px] leading-relaxed text-zinc-400">
                      {renderActivityText(activity, projectKey)}
                    </div>
                    {activity.issue && (
                      <div className="mt-2 text-[11px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] rounded px-2 py-1 truncate">
                        {projectKey}-{activity.issue.number} · {activity.issue.title}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/20 border-t border-white/[0.04]">
          <button 
            onClick={fetchActivity}
            className="w-full py-2 text-[12px] font-medium text-zinc-500 hover:text-accent-400 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Feed
          </button>
        </div>
      </div>
    </>
  );
}

function getActivityIcon(action: string, fieldName: string | null) {
  if (action === 'created') {
    return (
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );
  }
  if (action === 'commented') {
    return (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  if (fieldName === 'status') {
    return (
      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    );
  }
  if (fieldName === 'assignee') {
    return (
      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function renderActivityText(activity: ActivityEntry, projectKey: string) {
  if (activity.action === 'created') return 'Created this issue';
  if (activity.action === 'commented') return 'Added a new comment';
  
  if (activity.action === 'updated' && activity.fieldName) {
    const field = activity.fieldName.charAt(0).toUpperCase() + activity.fieldName.slice(1);
    
    if (activity.fieldName === 'status') {
      return `Moved to a different status`;
    }
    if (activity.fieldName === 'assignee') {
      return activity.newValue ? 'Assigned a team member' : 'Removed assignee';
    }
    
    return `Updated the ${activity.fieldName}`;
  }
  
  return 'Updated the issue';
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSecs < 60) return 'just now';
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

