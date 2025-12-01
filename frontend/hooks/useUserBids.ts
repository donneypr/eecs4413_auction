'use client';

import { useState, useEffect } from 'react';
import { userApi } from '@/lib/api';

interface BidItem {
  id: number;
  name: string;
  description: string;
  current_price: string;
  seller_username: string;
  images: Array<{ data: string; format: string; order: number }>;
  thumbnail: string;
  is_active: boolean;
  remaining_time: string;
  bid_amount?: string;
}

export function useUserBids(username: string) {
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const data = await userApi.getBids(username);
        setBids(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bids');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchBids();
    }
  }, [username]);

  return { bids, loading, error };
}
