'use client';

import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from 'date-fns';
import type { Issue, IssueStatus } from '../kanban/types';

interface IssueCalendarViewProps {
  issues: Issue[];
  statuses: IssueStatus[];
  workspaceId: string;
  projectId: string;
  projectKey: string;
  onIssueClick?: (issue: Issue) => void;
}

export function IssueCalendarView({
  issues,
  projectKey,
  onIssueClick,
}: IssueCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  const issuesByDay = useMemo(() => {
    const map = new Map<string, Issue[]>();
    issues.forEach((issue) => {
      if (issue.dueDate) {
        const date = format(parseISO(issue.dueDate), 'yyyy-MM-dd');
        if (!map.has(date)) {
          map.set(date, []);
        }
        map.get(date)?.push(issue);
      }
    });
    return map;
  }, [issues]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="flex flex-col h-full bg-surface-card border border-white/[0.06] rounded-xl overflow-hidden animate-in">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white min-w-[150px]">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1 bg-white/[0.05] rounded-lg p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white/5 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500 uppercase tracking-wider font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Medium</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Weekdays Header */}
        <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.01]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="px-4 py-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-r border-white/[0.04] last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-auto divide-x divide-y divide-white/[0.04] border-b border-white/[0.04]">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayIssues = issuesByDay.get(dateStr) || [];
            const isSelectedMonth = isSameMonth(day, currentMonth);
            
            return (
              <div
                key={day.toString()}
                className={`min-h-[120px] flex flex-col p-2 transition-colors ${
                  isSelectedMonth ? 'bg-transparent' : 'bg-white/[0.01] opacity-40'
                }`}
              >
                <div className="flex justify-between items-center mb-1 px-1">
                  <span className={`text-[12px] font-medium ${
                    isToday(day) 
                      ? 'w-6 h-6 flex items-center justify-center bg-primary-500 text-white rounded-full' 
                      : 'text-slate-500'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayIssues.length > 0 && (
                    <span className="text-[10px] text-slate-600 font-medium">
                      {dayIssues.length} {dayIssues.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-0.5">
                  {dayIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => onIssueClick?.(issue)}
                      className={`w-full text-left px-2 py-1.5 rounded border border-transparent hover:border-white/10 transition-all ${
                        PRIORITY_COLORS[issue.priority]
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[9px] font-mono opacity-60 truncate">
                          {projectKey}-{issue.number}
                        </span>
                        <div 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: issue.status.color }}
                        />
                      </div>
                      <div className="text-[11px] font-medium leading-tight line-clamp-2">
                        {issue.title}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

