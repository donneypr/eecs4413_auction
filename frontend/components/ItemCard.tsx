'use client';

import Link from 'next/link';
import Countdown from './Countdown';

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

  return (
    <Link
      href={`/items/${item.id}`}
      className="block rounded-2xl border hover:shadow overflow-hidden bg-white"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-lg font-semibold line-clamp-1">{item.name}</div>
        {item.description && (
          <div className="text-sm mt-1 line-clamp-2">{item.description}</div>
        )}
        <div className="mt-2">
          Current: <strong>${Number(item.current_price).toFixed(2)}</strong>
        </div>
        <div className="mt-1 text-xs text-gray-600">
          <Countdown endTime={item.end_time} serverNow={serverNow} />
        </div>
      </div>
    </Link>
  );
}