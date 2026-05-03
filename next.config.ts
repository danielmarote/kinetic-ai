import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "kinetic-ai-indol.vercel.app",
        "*.vercel.app",
        "wearehelply.com",
        "www.wearehelply.com",
      ],
    },
  },
};

export default nextConfig;
