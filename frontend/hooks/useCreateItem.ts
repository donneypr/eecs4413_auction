'use client';

import { useState } from 'react';
import { itemsApi } from '@/lib/api';

interface CreateItemData {
  name: string;
  description: string;
  starting_price: string;
  auction_type: string;
  end_time: string;
  images_data?: string[];
  dutch_decrease_percentage?: string;
  dutch_decrease_interval?: number;
}

export function useCreateItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = async (data: CreateItemData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await itemsApi.createItem(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create item';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createItem, loading, error };
}
