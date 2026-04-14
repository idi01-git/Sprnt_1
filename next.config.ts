import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default function nextConfig(): NextConfig {
  return {
    // Removed distDir entirely to use the default ".next" directory.
    // This allows Vercel to find your build automatically.
    turbopack: {
      root: projectRoot,
    },
  };
}