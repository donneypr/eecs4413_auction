import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'KickBay',
  description: 'Auction marketplace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* server-rendered header, no flicker */}
        <Header />
        {children}
      </body>
    </html>
  );
}