import Link from 'next/link';

import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-primary-900 dark:text-white sm:text-6xl">
            Kanban<span className="text-primary-600">5000</span>
          </h1>
          <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            A fast, minimal, developer-friendly issue tracker with AI assistance
            and deep Git integrations.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            {session ? (
              <Link
                href="/workspaces"
                className="btn btn-primary px-8 py-3 text-base"
              >
                Go to Workspaces
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-primary px-8 py-3 text-base"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="btn btn-secondary px-8 py-3 text-base"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Lightning Fast"
            description="Built for speed with PostgreSQL FTS, optimized queries, and a minimal footprint."
            icon="⚡"
          />
          <FeatureCard
            title="Developer-First"
            description="Deep Git integration, branch links, commit references, and keyboard shortcuts."
            icon="🛠️"
          />
          <FeatureCard
            title="AI Assistance"
            description="Smart issue summarization, priority suggestions, and duplicate detection."
            icon="🤖"
          />
          <FeatureCard
            title="Custom Workflows"
            description="Define your own statuses, transitions, and automation rules per project."
            icon="🔄"
          />
          <FeatureCard
            title="Team Collaboration"
            description="Real-time updates, comments, mentions, and workspace-level permissions."
            icon="👥"
          />
          <FeatureCard
            title="API First"
            description="Full REST API with OpenAPI spec and generated TypeScript SDK."
            icon="📡"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

