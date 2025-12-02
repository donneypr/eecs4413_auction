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
    <html lang="en">
      <body>
        <AuthProvider>
        {/* server-rendered header, no flicker */}
        <Header />
        {children}
        </AuthProvider>
      </body>
    </html>
  );
}