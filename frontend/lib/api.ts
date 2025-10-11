const isServer = typeof window === "undefined";

export const API_BASE = isServer
  // inside the Next.js server/container, reach Django by service name
  ? process.env.API_BASE_INTERNAL || "http://backend:8000"
  // in the browser on your machine, reach Django at localhost
  : process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";