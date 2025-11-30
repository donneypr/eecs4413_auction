'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function FilterBar({
  initialSort,
  initialType,
}: {
  initialSort: string;
  initialType: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const apply = (updates: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    next.delete('page'); // reset pagination on filter change
    router.push(`/?${next.toString()}`);
  };

  return (
    <div className="flex gap-4">
      {/* Category placeholder — not wired to backend yet */}
      <select className="border rounded-xl px-3 py-2" disabled>
        <option>All categories</option>
      </select>

      {/* Sort */}
      <select
        className="border rounded-xl px-3 py-2"
        defaultValue={initialSort}
        onChange={(e) => apply({ sort: e.target.value })}
      >
        <option value="ending_soon">Ending soon</option>
        {/* These need backend support to be server-side sorted.
            Leave them for later or implement client-side sorting. */}
        {/* <option value="newest">Newest</option>
        <option value="price_asc">Price: Low → High</option>
        <option value="price_desc">Price: High → Low</option> */}
      </select>

      {/* Type */}
      <select
        className="border rounded-xl px-3 py-2"
        defaultValue={initialType}
        onChange={(e) => apply({ type: e.target.value })}
      >
        <option value="">All types</option>
        <option value="FORWARD">Forward</option>
        <option value="DUTCH">Dutch</option>
      </select>
    </div>
  );
}