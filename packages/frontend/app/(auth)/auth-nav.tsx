'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchBox } from '@/components/search';

interface AuthNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  signOutAction: () => Promise<void>;
}

export function AuthNav({ user, signOutAction }: AuthNavProps) {
  const pathname = usePathname();
  const isInProject = pathname.match(/\/workspaces\/[^\/]+\/projects\/[^\/]+/);

  return (
    <nav className="nav-bar sticky top-0 z-50">
      <div className="h-full max-w-[1800px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-8">
          <Link 
            href="/workspaces" 
            className="font-bold text-lg bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent hover:from-primary-300 hover:to-primary-400 transition-all"
          >
            Kanban5000
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <Link
              href="/workspaces"
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Workspaces
            </Link>
          </div>
        </div>

        {/* Center - Search (only visible in project context) */}
        {isInProject && (
          <div className="hidden md:block">
            <SearchBox />
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="h-7 w-7 rounded-full ring-1 ring-white/10"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xs font-medium text-white">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm text-slate-300 hidden sm:block">
              {user.name || user.email?.split('@')[0]}
            </span>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-white px-2 py-1 hover:bg-white/5 rounded transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}

