import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared workspace package (Prisma client) is shipped as TS source.
  transpilePackages: ["@repo/db"],

  // Dev-only: Next 16 blocks its /_next dev resources (HMR + lazy chunks) from
  // non-localhost origins. Allow the machine's LAN IP so opening the app via the
  // printed "Network" URL (or from a phone on the same Wi-Fi) works too.
  // Update this if your LAN IP changes — or just use http://localhost:3000.
  allowedDevOrigins: ["192.168.214.102"],
};

export default nextConfig;
