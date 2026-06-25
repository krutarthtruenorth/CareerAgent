import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse loads PDF.js worker assets at runtime. Keeping it external lets
  // Node resolve those assets from node_modules instead of a Next.js chunk.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
