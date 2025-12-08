import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
    }),
    // Credentials provider for development/testing
    Credentials({
      name: 'Development',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email as string;
        const name = (credentials.name as string) || 'Dev User';

        // For development, sync with backend and return user
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: 'credentials',
              providerAccountId: email, // Use email as provider account ID
              email,
              name,
              image: null,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            return {
              id: data.data.user.id,
              email: data.data.user.email,
              name: data.data.user.name,
              image: data.data.user.image,
              backendToken: data.data.token,
            };
          }
        } catch (error) {
          console.error('Backend sync failed:', error);
        }

        // Fallback for when backend is not available
        return {
          id: `dev-${email}`,
          email,
          name,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For credentials, user is already synced in authorize()
      if (account?.provider === 'credentials') {
        return true;
      }

      // For OAuth providers, sync with backend
      if (!account) return false;

      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: account.provider,
            providerAccountId: account.providerAccountId || user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }),
        });

        if (!response.ok) {
          console.error('Failed to sync user to backend');
          // Allow in development
          return process.env.NODE_ENV === 'development';
        }

        const data = await response.json();
        (user as any).backendToken = data.data.token;
        (user as any).backendUserId = data.data.user.id;

        return true;
      } catch (error) {
        console.error('Error syncing user to backend:', error);
        return process.env.NODE_ENV === 'development';
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = (user as any).backendToken;
        token.backendUserId = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).backendToken = token.backendToken;
      (session as any).backendUserId = token.backendUserId;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches backend JWT expiry)
  },
  debug: process.env.NODE_ENV === 'development',
});

// Type augmentation for session
declare module 'next-auth' {
  interface Session {
    backendToken?: string;
    backendUserId?: string;
  }
}
