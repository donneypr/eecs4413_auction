// app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ItemCard from '@/components/ItemCard';

type SP = Record<string, string | string[] | undefined>;
const get = (sp: SP, k: string) =>
  typeof sp[k] === 'string' ? (sp[k] as string) : undefined;

async function fetchItems(sp: SP) {
  const base = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;
  const q = get(sp, 'q');
  const sort = get(sp, 'sort') || 'ending_soon';

  const rawStatus = get(sp, 'status');
  const status = rawStatus === undefined ? 'active' : rawStatus; // '', 'active', 'ended'

  const type = get(sp, 'type'); // '', 'FORWARD', 'DUTCH'

  const params = new URLSearchParams();
  params.set('sort', sort);
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  if (type) params.set('type', type);
  params.set('page_size', '24');

  const res = await fetch(`${base}/items/?${params.toString()}`, { cache: 'no-store' });
  const serverNow = Date.parse(res.headers.get('date') ?? new Date().toUTCString());
  if (!res.ok) return { results: [], serverNow };
  const data = await res.json();
  return { ...data, serverNow };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const q = get(sp, 'q') || '';
  const sort = get(sp, 'sort') || 'ending_soon';
  const rawStatus = get(sp, 'status');
  const status = rawStatus === undefined ? 'active' : rawStatus;
  const type = get(sp, 'type') || '';

  const data = await fetchItems(sp);
  const results: any[] = data?.results ?? [];

  // Use distinct keys for siblings
  const keyBase = `${sort}|${status}|${type}|${q}`;

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <form
        key={`form:${keyBase}`}
        method="get"
        action="/"
        className="mb-4 flex flex-wrap items-center gap-3"
        autoComplete="off"
      >
        {q && <input type="hidden" name="q" value={q} />}

        <label className="text-sm text-gray-600">Sort:</label>
        <select name="sort" defaultValue={sort} className="border rounded px-2 py-2">
          <option value="ending_soon">Ending soon</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Lo → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>

        <select name="type" defaultValue={type} className="border rounded px-2 py-2">
          <option value="">All types</option>
          <option value="FORWARD">Forward</option>
          <option value="DUTCH">Dutch</option>
        </select>

        <select name="status" defaultValue={status} className="border rounded px-2 py-2">
          <option value="active">Active only</option>
          <option value="ended">Ended</option>
          <option value="">All</option>
        </select>

        <button type="submit" className="border rounded px-3 py-2">Apply</button>
      </form>

      <div key={`grid:${keyBase}`} className="grid gap-6 md:grid-cols-3">
        {results.length === 0 ? (
          <div className="col-span-full text-sm text-gray-600">No results.</div>
        ) : (
          results.map((item) => (
            <ItemCard key={item.id} item={item} serverNow={data.serverNow} />
          ))
        )}
      </div>
    </main>
  );
}