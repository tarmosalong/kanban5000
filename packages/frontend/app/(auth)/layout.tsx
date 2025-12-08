import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth, signOut } from '@/lib/auth';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
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

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-7 w-7 rounded-full ring-1 ring-white/10"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xs font-medium text-white">
                  {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-300 hidden sm:block">
                {session.user?.name || session.user?.email?.split('@')[0]}
              </span>
            </div>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
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

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto">{children}</main>
    </div>
  );
}
