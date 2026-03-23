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
  // Strip console in production builds (keeps error/warn).
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  // Profiling only in dev — avoids production runtime issues with `next start` (webpack chunk loading).
  experimental:
    process.env.NODE_ENV === "development"
      ? {
          swcTraceProfiling: true,
        }
      : {},
}

export default nextConfig
