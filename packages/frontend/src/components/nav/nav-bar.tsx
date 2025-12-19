'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchBox } from '../search';

interface NavBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();
  const isInProject = pathname.match(/\/workspaces\/[^\/]+\/projects\/[^\/]+/);

  return (
    <nav className="h-[52px] sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="h-full max-w-[1800px] mx-auto px-5 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-6">
          <Link 
            href="/workspaces" 
            className="font-semibold text-[15px] text-white hover:text-accent-400 transition-colors tracking-tight"
          >
            Kanban5000
          </Link>
          <div className="hidden sm:flex items-center">
            <Link
              href="/workspaces"
              className={`px-2.5 py-1.5 text-[13px] rounded-md transition-colors ${
                pathname === '/workspaces' 
                  ? 'text-white bg-white/[0.06]' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              }`}
            >
              Workspaces
            </Link>
            <Link
              href="/my-issues"
              className={`px-2.5 py-1.5 text-[13px] rounded-md transition-colors ${
                pathname === '/my-issues' 
                  ? 'text-white bg-white/[0.06]' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              }`}
            >
              My Issues
            </Link>
          </div>
        </div>

        {/* Center - Search (only visible in project context) */}
        {isInProject && (
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <SearchBox />
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
              pathname === '/profile'
                ? 'bg-white/[0.06] text-white'
                : 'hover:bg-white/[0.03] text-zinc-400'
            }`}
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="h-6 w-6 rounded-full ring-1 ring-white/[0.08]"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-[11px] font-medium text-zinc-900">
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-[13px] hidden sm:block">
              {user.name || user.email?.split('@')[0]}
            </span>
          </Link>
          <div className="w-px h-4 bg-white/[0.06] mx-1" />
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-[13px] text-zinc-600 hover:text-zinc-300 px-2 py-1 rounded-md hover:bg-white/[0.03] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
