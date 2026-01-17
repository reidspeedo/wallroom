import './globals.css';

import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'WallBoard Rooms',
  description:
    'A simple, always-on web dashboard for live room availability and instant booking.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
