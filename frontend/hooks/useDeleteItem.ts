'use client';

import { useState } from 'react';
import { itemsApi } from '@/lib/api';

export function useDeleteItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteItem = async (itemId: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await itemsApi.deleteItem(itemId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteItem, loading, error };
}
