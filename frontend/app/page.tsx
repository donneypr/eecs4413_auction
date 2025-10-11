import { API_BASE } from "@/lib/api";

type Item = { id:number; title:string; description:string; starting_price:string; created_at:string };

export default async function Home() {
  const res = await fetch(`${API_BASE}/items/`, { cache: "no-store" });
  const items: Item[] = await res.json();

  return (
    <main style={{ padding: 24 }}>
      <h1>Auction Frontend</h1>
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