import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@toll/stellar"],
}

export default nextConfig
