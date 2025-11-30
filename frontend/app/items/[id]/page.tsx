import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getItem(id: string) {
  const base = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;
  const res = await fetch(`${base}/items/${id}/`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return notFound();

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold">{item.name}</h1>
      <p className="mt-2 text-lg">{item.description}</p>
      <div className="mt-4 text-xl">
        Current price: <strong>${Number(item.current_price).toFixed(2)}</strong>
      </div>
      {item.end_time && (
        <div className="mt-2 text-sm text-gray-600">
          Ends at: {item.end_time}
        </div>
      )}
    </main>
  );
}