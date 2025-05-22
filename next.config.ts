import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  swcMinify: true,
  reactStrictMode: true,
};

export default nextConfig;
