'use client';

import { useEffect, useRef, useState } from 'react';

function format(ms: number) {
  let s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600);  s %= 3600;
  const m = Math.floor(s / 60);    s %= 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  parts.push(`${h}h`, `${m}m`, `${s}s`);
  return parts.join(' ');
}

export default function Countdown({
  endTime,
  className,
  serverNow,
}: { endTime: string; className?: string; serverNow?: number }) {
  const offsetRef = useRef(0);
  if (serverNow && offsetRef.current === 0) {
    offsetRef.current = Date.now() - serverNow;
  }

  const target = new Date(endTime).getTime();
  const [left, setLeft] = useState(() =>
    Math.max(0, target - (Date.now() - offsetRef.current))
  );

  // keep timer handles in refs (works in both browser & node types)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () =>
      setLeft(Math.max(0, target - (Date.now() - offsetRef.current)));

    tick(); // initial render alignment

    const firstDelay = 1000 - (Date.now() % 1000);
    timeoutRef.current = setTimeout(() => {
      tick();
      intervalRef.current = setInterval(tick, 1000);
    }, firstDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutRef.current = null;
      intervalRef.current = null;
    };
  }, [target]); 

  return (
    <span className={className}>
      {left <= 0 ? 'Ended' : `Ends in: ${format(left)}`}
    </span>
  );
}