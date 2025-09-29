import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zk-medical/shared"],
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
