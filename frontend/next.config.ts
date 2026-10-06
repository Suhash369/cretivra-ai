import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '10.0.5.19:3000', '10.0.5.19'],
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://cretivra-ai-backend-dkmt.onrender.com'
        : 'http://127.0.0.1:8000');

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/chatwork',
        destination: '/studio',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
