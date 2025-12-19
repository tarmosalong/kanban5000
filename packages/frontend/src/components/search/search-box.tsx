'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
    return null;
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
          placeholder="Search issues..."
          className="w-48 sm:w-56 px-3 py-1.5 pl-8 text-[13px] bg-white/[0.03] border border-white/[0.06] rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-accent-400/30 focus:bg-white/[0.05] transition-all"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {/* Keyboard shortcut hint */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5">
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-[1.5px] border-zinc-700 border-t-accent-400 rounded-full animate-spin" />
          ) : (
            <kbd className="text-[10px] text-zinc-600 bg-white/[0.04] px-1 py-0.5 rounded border border-white/[0.06]">⌘K</kbd>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/[0.06] rounded-lg shadow-xl overflow-hidden z-50">
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-3 py-2 text-left hover:bg-white/[0.04] transition-colors flex items-center gap-3"
                >
                  <span className="text-zinc-600 text-[11px] font-mono">#{result.number}</span>
                  <span className="text-[13px] text-zinc-300 truncate flex-1">{result.title}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
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
            <div className="px-3 py-4 text-[13px] text-zinc-600 text-center">
              No issues found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
