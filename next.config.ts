import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {

  turbopack: { root: path.resolve(import.meta.dirname) },
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
