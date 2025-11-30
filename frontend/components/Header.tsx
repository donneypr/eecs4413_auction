// components/Header.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";

export default function Header() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [q, setQ] = useState(initialQ);

  // Keep input in sync when URL changes client-side
  useEffect(() => setQ(initialQ), [initialQ]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    router.push(`/?${next.toString()}`);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Logo (top-left) */}
        <a href="/" className="font-bold text-xl tracking-tight">
          <span className="inline-block rounded-lg bg-black text-white px-2 py-1 mr-2">KB</span>
          KickBay
        </a>

        {/* Centered Search */}
        <div className="flex-1 flex justify-center">
          <form onSubmit={onSubmit} className="w-full max-w-2xl">
            <div className="flex rounded-xl border border-gray-300 overflow-hidden bg-white">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search auctions…"
                className="w-full px-4 py-2 outline-none"
                aria-label="Search auctions"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white font-medium hover:bg-gray-800"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Auth (top-right) */}
        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-100"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
          >
            Sign up
          </a>
        </div>
      </div>
    </header>
  );
}