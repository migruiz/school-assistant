import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mockmind-api.uifaces.co",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
