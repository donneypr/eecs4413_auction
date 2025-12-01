'use client';

import { useState } from 'react';
import { itemsApi } from '@/lib/api';

interface EditItemData {
  name?: string;
  description?: string;
  image_order?: number[];
}

export function useEditItem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editItem = async (itemId: number, data: EditItemData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await itemsApi.editItem(itemId, data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to edit item';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { editItem, loading, error };
}
