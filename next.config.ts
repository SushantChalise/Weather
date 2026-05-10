import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/atlas/glaciers",
        destination: "/atlas/30-years",
        permanent: true,
      },
    ];
  },
  // Mirror public/_headers so dev (where Cloudflare _headers is not honored)
  // serves Brotli-precompressed assets with the right Content-Encoding,
  // letting the browser decompress transparently. Production on Cloudflare
  // Pages uses _headers; both paths should behave identically.
  async headers() {
    return [
      {
        source: "/glaciers/hkh/:file*.geojson.br",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Content-Encoding", value: "br" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/glacial-lakes/:file*.geojson.br",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Content-Encoding", value: "br" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
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
