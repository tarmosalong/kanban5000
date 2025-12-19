import type { Metadata } from 'next';

import '@/styles/globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Kanban5000',
  description: 'A fast, minimal, developer-friendly issue tracker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-sm tracking-tight">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
