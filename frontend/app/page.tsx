import { API_BASE } from "@/lib/api";

type Item = { id:number; title:string; description:string; starting_price:string; created_at:string };
type ItemsResponse = Item[] | { results?: Item[] };

export default async function Home() {
  const res = await fetch(`${API_BASE}/items/search/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);

  const data: ItemsResponse = await res.json();
  const items: Item[] = Array.isArray(data) ? data : (data.results ?? []);

  return (
    <main style={{ padding: 24 }}>
      <h1>kickBay Frontend</h1>
      <p>API status: {res.ok ? "OK" : "DOWN"}</p>
      <h2>Items</h2>
      <ul>
        {items.map(i => (
          <li key={i.id}><strong>{i.title}</strong> — ${i.starting_price}</li>
        ))}
      </ul>
    </main>
  );
}