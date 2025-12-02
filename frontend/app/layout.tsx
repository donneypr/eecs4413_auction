import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { AuthProvider } from './contexts/AuthContext';

export const metadata: Metadata = {
  title: 'KickBay',
  description: 'Auction marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-scheme="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-[var(--color-background)] text-[var(--color-text)]">
        <AuthProvider>
        {/* server-rendered header, no flicker */}
        <Header />
        {children}
        </AuthProvider>
      </body>
    </html>
  );
}