/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // OneDrive can turn stale .next/static cache entries into invalid links.
  // Keep a dedicated local output directory, while using Vercel's expected .next
  // directory during hosted builds.
  distDir: process.env.VERCEL === '1'
    ? '.next'
    : (process.env.NEXT_DIST_DIR || '.next-build'),
}

module.exports = nextConfig
