// app/components/Filters.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export default function Filters() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = sp.get('q') ?? '';
  const sort = sp.get('sort') ?? 'ending_soon';
  const type = sp.get('type') ?? 'ALL';

  const basePath = useMemo(() => '/', []);

  function update(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (!v || v === 'ALL') next.delete(k);
      else next.set(k, v);
    });
    // reset to page 1 if filters change
    next.delete('page');
    router.push(`${basePath}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        className="rounded-xl border px-4 py-3"
        value={type}
        onChange={(e) => update({ type: e.target.value })}
      >
        <option value="ALL">All types</option>
        <option value="FORWARD">Forward</option>
        <option value="DUTCH">Dutch</option>
      </select>

      <select
        className="rounded-xl border px-4 py-3"
        value={sort}
        onChange={(e) => update({ sort: e.target.value })}
      >
        <option value="ending_soon">Ending soon</option>
        <option value="newest">Newest</option>
        <option value="price_low">Price: Low → High</option>
        <option value="price_high">Price: High → Low</option>
      </select>
    </div>
  );
}