'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getProjectKey } from '@/lib/issue-key';
import { LoadingSpinner } from './loading';

interface SearchResult {
  id: string;
  number: number;
  title: string;
  priority: string;
  projectId: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projectContext, setProjectContext] = useState<{ workspaceId: string; projectId: string } | null>(null);
  const [projectKey, setProjectKey] = useState('PROJ');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Extract project context from URL
  useEffect(() => {
    const match = pathname.match(/\/workspaces\/([^\/]+)\/projects\/([^\/]+)/);
    if (match) {
      setProjectContext({ workspaceId: match[1], projectId: match[2] });
    } else {
      setProjectContext(null);
      setProjectKey('PROJ');
    }
  }, [pathname]);

  // Fetch project slug for the key
  useEffect(() => {
    if (!projectContext) return;
    
    fetch(`/api/projects/${projectContext.projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.data?.slug) {
          setProjectKey(getProjectKey(data.data.slug));
        }
      })
      .catch(() => {});
  }, [projectContext]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Search issues if in project context, otherwise maybe search workspaces/projects later
        const url = projectContext 
          ? `/api/search?projectId=${projectContext.projectId}&q=${encodeURIComponent(query)}`
          : `/api/search/global?q=${encodeURIComponent(query)}`; // Global search placeholder
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, projectContext]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (projectContext) {
      router.push(`/workspaces/${projectContext.workspaceId}/projects/${projectContext.projectId}/issues/${result.id}`);
    } else {
      // Handle global result (need to find its workspace/project)
      router.push(`/api/resolve-issue/${result.id}`); // Placeholder for global resolution
    }
    onClose();
  }, [projectContext, router, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in"
        onClick={onClose}
      />
      
      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-white/[0.04]">
          <svg className="w-5 h-5 text-zinc-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search issues, projects, or commands..."
            className="flex-1 h-14 bg-transparent text-white placeholder:text-zinc-600 focus:outline-none text-[15px]"
          />
          {isLoading && <LoadingSpinner className="w-4 h-4 ml-2" />}
          <div className="flex items-center gap-1.5 ml-4">
            <kbd className="px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-zinc-500 text-[10px] font-medium">ESC</kbd>
          </div>
        </div>

        {/* Results / Navigation */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {query.trim() === '' ? (
            <div className="px-2">
              <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Navigation</div>
              <NavItem icon="🏠" label="Workspaces" href="/workspaces" onClick={onClose} />
              <NavItem icon="📋" label="My Issues" href="/my-issues" onClick={onClose} />
              <NavItem icon="👤" label="Profile Settings" href="/profile" onClick={onClose} />
              
              <div className="mt-4 px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Quick Actions</div>
              <div 
                onClick={() => {
                  if (projectContext) {
                    router.push(`/workspaces/${projectContext.workspaceId}/projects/${projectContext.projectId}/issues/new`);
                    onClose();
                  } else {
                    router.push('/workspaces');
                    onClose();
                  }
                }}
                className="px-3 py-2 flex items-center gap-3 text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg cursor-pointer transition-colors group"
              >
                <span className="w-5 h-5 flex items-center justify-center bg-zinc-800 rounded border border-white/[0.04] group-hover:border-accent-500/20">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                {projectContext ? 'Create New Issue' : 'Select Project to Create Issue'}
                <kbd className="ml-auto text-[10px] text-zinc-600 font-mono">C</kbd>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="px-2 space-y-0.5">
              <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Issues</div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-3 py-2.5 text-left rounded-lg transition-colors flex items-center gap-3 ${
                    index === selectedIndex ? 'bg-white/[0.06] text-white' : 'text-zinc-400'
                  }`}
                >
                  <span className="text-zinc-600 text-[11px] font-mono shrink-0">{projectKey}-{result.number}</span>
                  <span className="text-[13px] truncate flex-1">{result.title}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                    result.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                    result.priority === 'high' ? 'bg-amber-500/10 text-amber-400' :
                    result.priority === 'medium' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    {result.priority}
                  </span>
                </button>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="py-12 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-[13px] text-zinc-500">No results found for "{query}"</div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-950/50 border-t border-white/[0.04] flex items-center gap-4 text-[11px] text-zinc-600">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] font-mono">↵</kbd>
            <span>to select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] font-mono">↑↓</kbd>
            <span>to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, href, onClick }: { icon: string; label: string; href: string; onClick: () => void }) {
  const router = useRouter();
  return (
    <div 
      onClick={() => {
        router.push(href);
        onClick();
      }}
      className="px-3 py-2.5 flex items-center gap-3 text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-lg cursor-pointer transition-colors"
    >
      <span className="w-5 h-5 flex items-center justify-center grayscale opacity-70 group-hover:grayscale-0">{icon}</span>
      {label}
    </div>
  );
}

