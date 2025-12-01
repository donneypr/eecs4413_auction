'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { apiClient } from '@/lib/api';

type User = { username: string; first_name?: string };

function firstInitial(first?: string, fallback?: string) {
  const s = (first?.trim() || fallback?.trim() || '?');
  const ch = Array.from(s)[0];
  return ch ? ch.toUpperCase() : '?';
}

function SearchBoxInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  useEffect(() => setQ(searchParams.get('q') ?? ''), [searchParams]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q); else params.delete('q');
    router.push(params.toString() ? `/?${params}` : `/`);
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md sm:max-w-lg gap-2">
      <input
        className="flex-1 border rounded-xl px-3 py-2.5 h-11"
        placeholder="Search auctions…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button className="border rounded-xl px-4 h-11" type="submit">Search</button>
    </form>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authService.getCurrentUser();
        const username =
          me?.username ??
          me?.user?.username ??
          (typeof me?.email === 'string' ? me.email.split('@')[0] : '') ?? '';
        const firstName =
          me?.first_name ?? me?.firstName ?? me?.user?.first_name ?? me?.profile?.first_name ?? '';
        const mapped: User | null = username ? { username, first_name: firstName || undefined } : null;
        if (!cancelled) setUser(mapped);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  const onLogout = async () => {
    try {
      await apiClient.get('/auth/csrf/');
      await authService.logout();
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  const initial = firstInitial(user?.first_name, user?.username);
  const displayName = user?.first_name || user?.username || '';

  return (
    <header className="mt-4 sm:mt-6 flex items-center justify-between gap-4 px-8 py-5 border-b">
      <Link href="/" className="font-bold text-2xl md:text-5xl tracking-wide">
        KickBay
      </Link>

      {!isAuthPage && (
        <Suspense fallback={<div className="w-full max-w-lg h-11" />}>
          <SearchBoxInner />
        </Suspense>
      )}

      <nav className="flex items-center gap-4">
        {user === undefined ? (
          <div className="w-24 h-6" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${encodeURIComponent(user.username)}`}
              prefetch={false}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-base md:text-lg">
                {initial}
              </div>
              <span className="hidden sm:inline text-base md:text-lg">{displayName}</span>
            </Link>
            <button onClick={onLogout} className="underline text-sm md:text-base" type="button">
              Log out
            </button>
          </div>
        ) : (
          !isAuthPage && (
            <>
              <Link href="/login" className="underline text-base md:text-lg">Sign in</Link>
              <Link href="/signup" className="underline text-base md:text-lg">Sign up</Link>
            </>
          )
        )}
      </nav>
    </header>
  );
}