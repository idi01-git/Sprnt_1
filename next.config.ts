import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const DEV_DIST_DIR = ".next-runtime";
const PROD_DIST_DIR = ".next-prod";

export default function nextConfig(phase: string): NextConfig {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;
  const isProduction =
    phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;

  return {
    distDir: isDevelopment ? DEV_DIST_DIR : isProduction ? PROD_DIST_DIR : PROD_DIST_DIR,
    turbopack: {
      root: projectRoot,
    },
  };
}
