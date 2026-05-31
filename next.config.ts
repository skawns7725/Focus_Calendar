import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: process.cwd(),
  output: "standalone"
};

export default nextConfig;
