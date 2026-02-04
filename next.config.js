const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // SWC Compiler is the default in Next.js 16
  // Babel is NOT used - Next.js uses the Rust-based SWC compiler for faster builds
  // swcMinify is enabled by default and no longer needs to be specified
  
  // Enable Turbopack for faster builds
  experimental: {
    // Turbopack is enabled by default in Next.js 16
    // Custom configuration can be added here if needed
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 
          (process.env.NODE_ENV === 'development' 
            ? 'http://localhost:8000' 
            : 'https://potomac-analyst-workbench-production.up.railway.app')}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
