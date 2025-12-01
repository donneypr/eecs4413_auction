'use client';

import { useState, useEffect } from 'react';
import { userApi } from '@/lib/api';

interface Item {
  id: number;
  name: string;
  description: string;
  starting_price: string;
  current_price: string;
  seller_username: string;
  images: Array<{ data: string; format: string; order: number }>;
  thumbnail: string;
  is_active: boolean;
}

export function useUserItems(username: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await userApi.getItems(username);
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch items');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchItems();
    }
  }, [username]);

  return { items, loading, error };
}
