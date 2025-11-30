// app/page.tsx
import Link from "next/link";

// Temporary mocked data — step 3 will replace with live fetch
const MOCK = [
  {
    id: 1,
    name: "Wireless Headphones",
    description: "Great condition. Ships fast.",
    current_price: "42.50",
    end_time: "2025-12-05T18:30:00Z",
  },
  {
    id: 2,
    name: "Retro Game Console",
    description: "Includes 2 controllers.",
    current_price: "120.00",
    end_time: "2025-12-06T14:00:00Z",
  },
];

export default async function HomePage() {
  // Step 3: Replace MOCK with a fetch like:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/items/?status=active`, { cache: 'no-store', credentials: 'include' });
  // const data = await res.ok ? await res.json() : { results: [] };

  return (
    <div className="space-y-6">
      {/* Filters + Sort (UI only for now) */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Filters:</span>
            <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">Active</button>
            <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">Ending Soon</button>
            <button className="px-3 py-1.5 rounded-xl border hover:bg-gray-50">Under $50</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort:</span>
            <select className="px-3 py-1.5 rounded-xl border bg-white">
              <option value="relevance">Relevance</option>
              <option value="ending_soon">Ending soon</option>
              <option value="price_low_high">Price: Low → High</option>
              <option value="price_high_low">Price: High → Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </section>

      {/* Auctions grid */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Active auctions</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MOCK.map((item) => (
            <li key={item.id} className="group">
              <div className="h-full bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition">
                <div className="aspect-[4/3] rounded-xl bg-gray-100 mb-3" />
                <h3 className="font-medium mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Current price</div>
                    <div className="font-semibold">${item.current_price}</div>
                  </div>
                  <Link
                    href={`/items/${item.id}`}
                    className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}