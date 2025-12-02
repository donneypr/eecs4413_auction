'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/lib/auth';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '/api').replace(/\/$/, '');

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refetch: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // make sure authService.getCurrentUser uses { credentials: 'include' }
      const data = await authService.getCurrentUser();
      setUser(data.authenticated ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      // 1) set csrftoken cookie from backend
      try {
        await fetch(`${API_BASE}/auth/csrf/`, { method: 'GET', credentials: 'include' });
      } catch {}
      // 2) then fetch current user
      await fetchUser();
    })();
  }, []);

  return <AuthContext.Provider value={{ user, loading, refetch: fetchUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);