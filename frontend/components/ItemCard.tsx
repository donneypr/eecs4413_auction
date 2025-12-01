'use client';

import Link from 'next/link';
import Countdown from './Countdown';

type Item = {
  id: number;
  name: string;
  description?: string;
  current_price: number | string;
  end_time: string;          // <-- required
};

export default function ItemCard({ item, serverNow }: { item: Item; serverNow?: number }) {
  return (
    <Link href={`/items/${item.id}`} className="block rounded-2xl border p-4 hover:shadow">
      <div className="text-lg font-semibold">{item.name}</div>
      <div className="text-sm mt-1 line-clamp-2">{item.description}</div>
      <div className="mt-2">
        Current: <strong>${Number(item.current_price).toFixed(2)}</strong>
      </div>
      <div className="mt-1 text-xs text-gray-600">
        <Countdown endTime={item.end_time} serverNow={serverNow} />
      </div>
    </Link>
  );
}