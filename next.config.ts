import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Hide the floating "N" badge so the site looks like a native app on the phone.
  devIndicators: false,
};

export default nextConfig;
