'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface SearchResult {
  id: string;
  number: number;
  title: string;
  priority: string;
  projectId: string;
}

interface SearchBoxProps {
  className?: string;
}

export function SearchBox({ className = '' }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projectContext, setProjectContext] = useState<{ workspaceId: string; projectId: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Extract project context from URL
  useEffect(() => {
    const match = pathname.match(/\/workspaces\/([^\/]+)\/projects\/([^\/]+)/);
    if (match) {
      setProjectContext({ workspaceId: match[1], projectId: match[2] });
    } else {
      setProjectContext(null);
    }
  }, [pathname]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !projectContext) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search?projectId=${projectContext.projectId}&q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.data || []);
        } else {
          console.error('Search failed:', res.status);
          setResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, projectContext]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (projectContext) {
      router.push(`/workspaces/${projectContext.workspaceId}/projects/${projectContext.projectId}/issues/${result.id}`);
      setIsOpen(false);
      setQuery('');
    }
  }, [projectContext, router]);

  if (!projectContext) {
    return null; // Don't show search outside of project context
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search issues... (⌘K)"
          className="w-48 sm:w-64 px-3 py-1.5 pl-9 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.07] transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
                >
                  <span className="text-slate-500 text-xs font-mono">#{result.number}</span>
                  <span className="text-sm text-slate-200 truncate flex-1">{result.title}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    result.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                    result.priority === 'high' ? 'bg-amber-500/10 text-amber-400' :
                    result.priority === 'medium' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {result.priority}
                  </span>
                </button>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">
              No issues found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

