// app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SP = Record<string, string | string[] | undefined>;

const get = (sp: SP, k: string) =>
  typeof sp[k] === 'string' ? (sp[k] as string) : undefined;

async function fetchItems(sp: SP) {
  const base =
    process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;

  const q = get(sp, 'q');
  const sort = get(sp, 'sort') || 'ending_soon';
  const status = get(sp, 'status') || 'active'; // default: active only
  const type = get(sp, 'type'); // FORWARD or DUTCH

  const params = new URLSearchParams();
  params.set('sort', sort);
  params.set('status', status);
  if (q) params.set('q', q);
  if (type) params.set('type', type);
  params.set('page_size', '24');

  const res = await fetch(`${base}/items/?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) return { results: [] };
  return res.json();
}

function timeLeft(end?: string | null) {
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return 'Ended';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${m}m ${ss}s`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const q = get(sp, 'q') || '';
  const sort = get(sp, 'sort') || 'ending_soon';
  const status = get(sp, 'status') || 'active';
  const type = get(sp, 'type') || '';

  const data = await fetchItems(sp);
  const results: any[] = data?.results ?? [];

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">Active auctions</h1>

      {/* Pure GET form (SSR-friendly) */}
      <form method="get" action="/" className="mb-4 flex flex-wrap items-center gap-3">
  {/* preserve current search query from the header search */}
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

      {results.length === 0 ? (
        <p>No results.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {results.map((item) => (
            <a
              key={item.id}
              href={`/items/${item.id}`}
              className="block rounded-2xl border p-6 hover:shadow"
            >
              <div className="text-2xl font-semibold">{item.name}</div>
              <div className="text-lg mt-2">Great condition</div>
              <div className="mt-3">
                Current:{' '}
                <strong>${Number(item.current_price).toFixed(2)}</strong>
              </div>
              {item.end_time && (
                <div className="text-sm text-gray-600 mt-1">
                  Ends in: {timeLeft(item.end_time)}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}