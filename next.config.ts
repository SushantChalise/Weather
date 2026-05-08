import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {},
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gibs.earthdata.nasa.gov",
        pathname: "/wmts/**",
      },
    ],
  },
};

export default nextConfig;
