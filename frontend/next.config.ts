import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // silence the workspace-root lockfile warning
  },
};

export default nextConfig;
