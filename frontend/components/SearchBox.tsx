'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchBox({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(initialQuery);

  // keep input in sync if user navigates back/forward
  useEffect(() => setQ(sp.get('q') ?? ''), [sp]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(sp.toString());
    if (q.trim()) next.set('q', q.trim());
    else next.delete('q');
    next.delete('page'); // reset pagination
    router.push(`/?${next.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-3">
      <input
        className="w-full border rounded-xl px-4 py-2"
        placeholder="Search auctions…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button className="border rounded-xl px-4 py-2 font-semibold">Search</button>
    </form>
  );
}