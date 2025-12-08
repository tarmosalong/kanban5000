'use client';

import { useState } from 'react';
import { WorkspaceStats } from '@/components/workspace';

interface WorkspaceStatsSectionProps {
  workspaces: Array<{ id: string; name: string }>;
}

export function WorkspaceStatsSection({ workspaces }: WorkspaceStatsSectionProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaces[0]?.id || '');

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Workspace Statistics
        </h2>
        
        {workspaces.length > 1 && (
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id} className="bg-slate-800">
                {workspace.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedWorkspaceId && (
        <WorkspaceStats workspaceId={selectedWorkspaceId} />
      )}
    </div>
  );
}

