/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Disable static optimization for development
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      forceSwcTransforms: true,
    },
  }),
}

module.exports = nextConfig 