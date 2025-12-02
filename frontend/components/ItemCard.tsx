// components/ItemCard.tsx  (SERVER COMPONENT)
import Link from 'next/link';

type Image = { data: string; format: string; order: number };

type Item = {
  id: number;
  name: string;
  description?: string;
  current_price: number | string;
  end_time: string;
  thumbnail?: string;
  images?: Image[];
};

function prettyRemaining(endISO: string, serverNow?: number) {
  const end = Date.parse(endISO);
  const now = typeof serverNow === 'number' ? serverNow : Date.now();
  if (Number.isNaN(end)) return '';
  const ms = end - now;
  if (ms <= 0) return 'Ended';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function ItemCard({
  item,
  serverNow,
}: {
  item: Item;
  serverNow?: number;
}) {
  const thumbSrc =
    item.thumbnail ||
    (item.images?.length
      ? `data:image/${item.images[0].format};base64,${item.images[0].data}`
      : undefined);

  const remaining = prettyRemaining(item.end_time, serverNow);

  return (
    <Link
      href={`/items/${item.id}`}
      prefetch={false}
      className="block rounded-2xl border hover:shadow overflow-hidden bg-white"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-gray-100">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-base font-semibold line-clamp-1">{item.name}</div>
        {item.description && (
          <div className="text-sm mt-1 line-clamp-2">{item.description}</div>
        )}
        <div className="mt-2">
          Current: <strong>${Number(item.current_price).toFixed(2)}</strong>
        </div>
        <div className="mt-1 text-xs text-gray-600" suppressHydrationWarning>
          {remaining}
        </div>
      </div>
    </Link>
  );
}