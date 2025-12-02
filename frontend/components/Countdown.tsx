// components/Countdown.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function fmt(ms: number) {
  if (ms <= 0) return 'Ended';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}h ${m}m ${ss}s`;
}

export default function Countdown({
  endTime,
  serverNow,
  tickMs = 1000,
}: {
  endTime: string;
  serverNow?: number;
  tickMs?: number;
}) {
  const ssrNowRef = useRef<number>(typeof serverNow === 'number' ? serverNow : Date.now());

  const [now, setNow] = useState<number>(ssrNowRef.current);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const end = useMemo(() => new Date(endTime).getTime(), [endTime]);
  const remaining = end - now;

  return (
    <span suppressHydrationWarning>
      {fmt(remaining)}
    </span>
  );
}