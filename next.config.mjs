/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/combiner/i/**',
      },
      {
        protocol: 'https',
        hostname: '*.espncdn.com',
      },
    ],
  },
  // Phase 1 optimization: Strip console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error/warn for debugging
    } : false,
  },
  experimental: {
    swcTraceProfiling: true,
  },
}

export default nextConfig
