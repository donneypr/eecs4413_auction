//import type { NextConfig } from "next";

//const nextConfig: NextConfig = {
  /* config options here */
//};

//export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // next.config.js
async rewrites() {
  return [{ source: '/api/:path*', destination: 'http://backend-svc:8000/:path*' }];
},
};
module.exports = nextConfig;

