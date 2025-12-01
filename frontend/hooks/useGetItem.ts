'use client';

import { useState, useEffect } from 'react';
import { itemsApi } from '@/lib/api';

interface Image {
  data: string;
  format: string;
  order: number;
}

interface Item {
  id: number;
  name: string;
  description: string;
  images: Image[];
  thumbnail: string;
  starting_price: string;
  current_price: string;
  seller_username: string;
  current_bidder_username: string | null;
  is_active: boolean;
  end_time: string;
  created_at: string;
  bid_history: Array<{ bidder: string; amount: string; timestamp: string }>;
  auction_status: string;
  remaining_time: string;
}

export function useGetItem(itemId: number) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await itemsApi.getItem(itemId);
        setItem(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  return { item, loading, error };
}
