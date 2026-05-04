import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  org: "helply",
  project: "helply-nextjs",
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: !process.env.SENTRY_AUTH_TOKEN,
  // Disable source map upload if no auth token (avoids build failures)
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
