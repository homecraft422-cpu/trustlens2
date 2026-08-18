/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '3000-ipqufiku0iu05u13w1abs.e2b.app',
    '*.e2b.app',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  // Hide the framework version header (security hardening).
  poweredByHeader: false,
  // Compression is handled by the platform; disabling avoids double work.
  compress: false,
  // Keep uploads within the documented limits (10MB image / 100MB video /
  // 50MB audio — see src/lib/config.ts).
  experimental: {
    serverActions: { bodySizeLimit: '110mb' },
  },
  async headers() {
    return [
      {
        // Cache static assets aggressively.
        source: '/:path*.(svg|png|jpg|jpeg|gif|webp|ico|woff2|css|js)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
}

export default nextConfig
