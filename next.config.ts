import type { NextConfig } from "next";
import { deploymentUrls } from "./scripts/deployment-env.mjs";
const urls = deploymentUrls(process.env);
const config: NextConfig = {
  // Public origins only; never include credentials in Next.js env configuration.
  env: Object.fromEntries(Object.entries(urls).filter(([, value]) => value)),
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.convex.cloud" },
      { protocol: "https", hostname: "*.convex.site" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://accounts.google.com",
          },
        ],
      },
    ];
  },
};
export default config;
