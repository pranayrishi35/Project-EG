import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/~offline",
  },
  workboxOptions: {
    runtimeCaching: [
      {
        // Cache Supabase API Routes (Network First for mutable data like stats/credits)
        urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/(?!question_bank).*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Cache Question Bank for CBT Engine (Stale While Revalidate)
        urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/question_bank.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'question-bank-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      {
        // Cache Mock Test Route (Cache First for the shell)
        urlPattern: /\/practice\/mock\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'mock-engine-shell',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          },
        },
      },
      {
        // Cache Next.js Image Assets (Cache First)
        urlPattern: /\/_next\/image\?url=.+/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-image-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Cache Static Assets (CSS, JS)
        urlPattern: /\/_next\/static\/.+/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets-cache',
        },
      }
    ],
  },
});

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com https://avatars.githubusercontent.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/(legal)/**': ['./docs/legal/**/*'],
      '/terms': ['./docs/legal/**/*'],
      '/privacy': ['./docs/legal/**/*'],
      '/cookies': ['./docs/legal/**/*'],
      '/aup': ['./docs/legal/**/*'],
      '/refund-policy': ['./docs/legal/**/*']
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
