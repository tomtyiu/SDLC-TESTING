import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Weather — plan your day',
  description: 'Real-time weather data for any city in the world.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
