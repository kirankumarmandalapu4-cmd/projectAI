/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // OneDrive can turn stale .next/static cache entries into invalid links.
  // Keep generated output in a dedicated ignored directory for stable local builds.
  distDir: process.env.NEXT_DIST_DIR || '.next-build',
}

module.exports = nextConfig
