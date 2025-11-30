export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SP = { [k: string]: string | string[] | undefined };

function normBase(u: string) {
  return u.replace(/\/$/, '');
}

type ItemsEnvelope = { results: any[] } | any[];
function normalizeItems(body: ItemsEnvelope) {
  return Array.isArray(body) ? { results: body } : body;
}

async function getItems(q?: string, sort?: string) {
  const rawBase =
    process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;
  const base = normBase(rawBase);

  const url =
    q && q.trim()
      ? `${base}/items/search/?keyword=${encodeURIComponent(q)}`
      : `${base}/items/?status=active&sort=${encodeURIComponent(
          sort || 'ending_soon'
        )}&page_size=24`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { results: [] as any[] };

  const data = (await res.json()) as ItemsEnvelope;
  return normalizeItems(data);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: SP;
}) {
  const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const sort =
    typeof searchParams?.sort === 'string'
      ? searchParams.sort
      : 'ending_soon';

  const { results } = await getItems(q, sort);

  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">Active auctions</h1>

      {/* Simple GET form (no client handlers) */}
      <form action="/" method="get" className="mb-4 inline-flex items-center gap-2">
        <input
          name="q"
          defaultValue={q || ''}
          placeholder="Search auctions…"
          className="border rounded px-3 py-2"
        />
        <label htmlFor="sort" className="text-sm text-gray-700">Sort:</label>
        <select id="sort" name="sort" defaultValue={sort} className="border rounded px-2 py-1">
          <option value="ending_soon">Ending soon</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
        <button type="submit" className="border rounded px-3 py-2">Apply</button>
      </form>

      {results.length === 0 ? (
        <p>No results.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {results.map((item: any) => (
            <a
              key={item.id}
              href={`/items/${item.id}`}
              className="block rounded-2xl border p-6 hover:shadow"
            >
              <div className="text-2xl font-semibold">{item.name}</div>
              <div className="text-lg mt-2 line-clamp-2">{item.description}</div>
              <div className="mt-3">
                Current:{' '}
                <strong>${Number(item.current_price).toFixed(2)}</strong>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}