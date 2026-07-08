import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared workspace package (Prisma client) is shipped as TS source.
  transpilePackages: ["@repo/db"],
};

export default nextConfig;
