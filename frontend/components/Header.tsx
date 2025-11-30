'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SearchBoxInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  // Keep input in sync if URL changes
  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  const onSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const params = new URLSearchParams(searchParams);
  if (q) params.set('q', q);
  else params.delete('q');
  router.push(params.toString() ? `/?${params}` : `/`);   // go to home, not /items
};

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl gap-2">
      <input
        className="flex-1 border rounded px-3 py-2"
        placeholder="Search auctions…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button className="border rounded px-4 py-2" type="submit">Search</button>
    </form>
  );
}

export default function Header() {
  return (
    <header className="flex items-center justify-between gap-4 p-4 border-b">
      <Link href="/" className="font-semibold text-lg">KickBay</Link>
      <Suspense fallback={<div className="w-full max-w-xl h-10" />}>
        <SearchBoxInner />
      </Suspense>
      <nav className="flex items-center gap-3">
        <Link href="/login" className="underline">Sign in</Link>
        <Link href="/signup" className="underline">Sign up</Link>
      </nav>
    </header>
  );
}