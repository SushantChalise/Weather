import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gibs.earthdata.nasa.gov",
        pathname: "/wmts/**",
      },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
