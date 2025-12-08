import { redirect } from 'next/navigation';

import { auth, signOut } from '@/lib/auth';
import { AuthNav } from './auth-nav';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/' });
  };

  return (
    <div className="min-h-screen">
      <AuthNav 
        user={{
          name: session.user?.name,
          email: session.user?.email,
          image: session.user?.image,
        }}
        signOutAction={handleSignOut}
      />

      {/* Main content */}
      <main className="max-w-[1800px] mx-auto">{children}</main>
    </div>
  );
}
