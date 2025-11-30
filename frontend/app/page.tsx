// app/page.tsx (Server Component)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SP = Record<string, string | string[] | undefined>;

function normalizeResults(json: any) {
  if (Array.isArray(json)) return { results: json };
  if (Array.isArray(json?.results)) return { results: json.results };
  return { results: [] };
}

function pickStr(v: string | string[] | undefined) {
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
}

function fmtRemaining(item: any) {
  if (item?.remaining_time) return item.remaining_time;
  if (!item?.end_time) return undefined;
  const ms = new Date(item.end_time).getTime() - Date.now();
  if (Number.isNaN(ms)) return undefined;
  if (ms <= 0) return 'Ended';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${h}h ${m}m ${s}s`;
}

async function fetchItems(q?: string, sort = 'ending_soon') {
  const base = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;

  // Ask the API for active items only (works once backend supports it)
  const url = q?.trim()
    ? `${base}/items/search/?keyword=${encodeURIComponent(q)}&status=active`
    : `${base}/items/?status=active&sort=${encodeURIComponent(sort)}&page_size=24`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { results: [] };

  const { results } = normalizeResults(await res.json());

  // Client-side safety net: hide anything that looks ended
  const now = Date.now();
  const activeOnly = results.filter((it: any) => {
    const endedByFlag = it?.is_active === false;
    const endedByTime =
      it?.end_time ? new Date(it.end_time).getTime() <= now : false;
    return !(endedByFlag || endedByTime);
  });

  return { results: activeOnly };
}

export default async function HomePage({
  searchParams,
}: {
  // Next 15: searchParams is async
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = pickStr(sp.q);
  const sort = pickStr(sp.sort) ?? 'ending_soon';

  const { results } = await fetchItems(q, sort);

  return (
    <main className="p-4 max-w-6xl mx-auto space-y-4">
      <h1 className="text-3xl font-semibold">Active auctions</h1>

      {/* Sort only. We keep the query from the header via a hidden field */}
      <form action="/" method="get" className="flex items-center gap-3">
        <input type="hidden" name="q" value={q ?? ''} />
        <label htmlFor="sort" className="text-sm text-gray-700">Sort:</label>
        <select
          id="sort"
          name="sort"
          defaultValue={sort}
          className="border rounded px-2 py-1"
        >
          <option value="ending_soon">Ending soon</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
        <button type="submit" className="border rounded px-3 py-1">Apply</button>
      </form>

      {results.length === 0 ? (
        <p>No results.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {results.map((item: any) => {
            const ends = fmtRemaining(item);
            return (
              <a
                key={item.id}
                href={`/items/${item.id}`}
                className="block rounded-2xl border p-6 hover:shadow"
              >
                <div className="text-2xl font-semibold">{item.name}</div>
                <div className="text-lg mt-2">Great condition</div>
                <div className="mt-3">
                  Current: <strong>${Number(item.current_price).toFixed(2)}</strong>
                </div>
                {ends && (
                  <div className="text-sm text-gray-600 mt-1">Ends in: {ends}</div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}