import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Lower worker count to prevent VirtualAlloc out of memory crashes on Windows
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
