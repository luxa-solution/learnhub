// next.config.ts - FIXED VERSION
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // FIX: Use serverExternalPackages instead of experimental.serverComponentsExternalPackages
  serverExternalPackages: ['@mux/mux-node', 'stripe', 'ioredis']
};

export default nextConfig;
