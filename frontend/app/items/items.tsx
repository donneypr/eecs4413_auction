export const dynamic = 'force-dynamic';

import ItemCard from '@/components/ItemCard';

type Image = { data: string; format: string; order: number };

type Item = {
  id: number;
  name: string;
  description: string;
  current_price: number | string;
  end_time: string;
  thumbnail?: string;
  images?: Image[];
};

async function searchItems(q?: string, sort?: string, page?: string) {
  const base = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;
  const params = new URLSearchParams();
  if (q) params.set('keyword', q);
  if (sort) params.set('sort', sort);
  params.set('status', 'active');
  if (page) params.set('page', page);
  params.set('page_size', '24');

  const res = await fetch(`${base}/items/search/?${params.toString()}`, { cache: 'no-store' });
  const serverNow = Date.parse(res.headers.get('date') ?? new Date().toUTCString());

  if (!res.ok) return { results: [] as Item[], count: 0, page: 1, page_size: 24, serverNow };
  const data = await res.json();
  return { ...data, serverNow } as { results: Item[]; count: number; page: number; page_size: number; serverNow: number };
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; page?: string };
}) {
  const { q, sort, page } = searchParams;
  const data = await searchItems(q, sort, page);
  const items = data.results ?? [];

  return (
    <section className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Search results{q ? ` for “${q}”` : ''}</h1>

      <div className="flex items-center gap-3">
        <a className="underline text-sm" href={`/items?${new URLSearchParams({ q: q ?? '', sort: 'ending_soon' })}`}>Ending soon</a>
        <a className="underline text-sm" href={`/items?${new URLSearchParams({ q: q ?? '', sort: 'newest' })}`}>Newest</a>
        <a className="underline text-sm" href={`/items?${new URLSearchParams({ q: q ?? '', sort: 'price_asc' })}`}>Price ↑</a>
        <a className="underline text-sm" href={`/items?${new URLSearchParams({ q: q ?? '', sort: 'price_desc' })}`}>Price ↓</a>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-600">No results.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <li key={it.id}>
              <ItemCard item={it} serverNow={data.serverNow} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}