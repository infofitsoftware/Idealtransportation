/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // Re-enabled for static deployment
  images: {
    unoptimized: true,
  },
  // Add build timestamp to force cache invalidation
  env: {
    BUILD_TIME: Date.now().toString(),
  }
}

module.exports = nextConfig 