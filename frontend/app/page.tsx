// Server Component: fetch active items for the home feed
export const dynamic = 'force-dynamic'; // ensure fresh server fetch

type Item = {
  id: number;
  name: string;
  description: string;
  current_price: number | string;
  remaining_time?: string;
  seller_username?: string | null;
  end_time?: string;
};

async function getActiveItems(): Promise<{ results: Item[] }> {
  const base = process.env.API_BASE_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE!;
  const url = `${base}items/?status=active&sort=ending_soon&page_size=24`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { results: [] };
  return res.json();
}

export default async function HomePage() {
  const data = await getActiveItems();
  const items = data.results ?? [];

  return (
    <section className="p-6 space-y-4">
      {/* Filters + sort bar can stay simple for now; we’ll wire it next */}
      <div className="flex items-center gap-3">
        <select className="border rounded px-2 py-1">
          <option value="">All categories</option>
        </select>
        <select className="border rounded px-2 py-1" defaultValue="ending_soon">
          <option value="ending_soon">Ending soon</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Active auctions</h2>

        {items.length === 0 ? (
          <p className="text-sm text-gray-600">No active auctions yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <li key={it.id} className="border rounded p-4">
                <a href={`/items/${it.id}`} className="font-medium hover:underline">
                  {it.name}
                </a>
                <div className="text-sm mt-1 line-clamp-2">{it.description}</div>
                <div className="mt-2 text-sm">
                  Current: <span className="font-semibold">${it.current_price}</span>
                </div>
                {it.remaining_time && (
                  <div className="text-xs text-gray-600">Ends in: {it.remaining_time}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}