import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API responses set their own Cache-Control / CORS headers in src/lib/http.ts
  // so the whole HTTP contract lives in one place.
};

export default nextConfig;
