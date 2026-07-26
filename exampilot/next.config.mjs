import withPWAInit from "@ducanh2912/next-pwa";
import { withReticle } from "@reticlehq/next";

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
        // BYPASS SERVICE WORKER FOR AUTH: Ensure OAuth redirects never touch the PWA cache
        // or get aborted by aggressive timeouts.
        urlPattern: /\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        // MUST BE NETWORK FIRST: Ensure HTML documents always hit the server
        // so that middleware.ts runs and verifies the httpOnly cookie.
        urlPattern: ({ request, url }) => request.mode === 'navigate' || url.pathname === '/',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 15,
        },
      },
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

const isDev = process.env.NODE_ENV === 'development';

// The Reticle dev overlay (presenter.js/transport.js) pulls Google Fonts and
// connects to a local WebSocket. Those origins are allowed in development only;
// production stays strict and self-hosts its fonts via next/font.
const styleSrc = isDev
  ? "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
  : "style-src 'self' 'unsafe-inline';";
const fontSrc = isDev
  ? "font-src 'self' https://fonts.gstatic.com;"
  : "font-src 'self';";
const connectSrc = isDev
  ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com;"
  : "connect-src 'self' https://*.supabase.co wss://*.supabase.co;";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    ${styleSrc}
    img-src 'self' blob: data: https: http:;
    ${fontSrc}
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${connectSrc}
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
  webpack(config, ctx) {
    // Edge Runtime V8 sandbox disallows dynamic string evaluation (eval).
    // Ensure Webpack sourcemaps never use eval wrappers in Edge Runtime or production builds:
    if (ctx.nextRuntime === 'edge' || (config.devtool && typeof config.devtool === 'string' && config.devtool.includes('eval'))) {
      config.devtool = ctx.dev ? 'inline-source-map' : false;
    }

    // Intercept development pre-loaders (such as Reticle's data-reticle-source JSX injection)
    // and exclude Three.js Canvas components to prevent R3F dashed-prop split collisions
    // (e.g. attempting to assign instance.data.reticle.source on Three.js geometry meshes).
    if (config.module && Array.isArray(config.module.rules)) {
      config.module.rules.forEach((rule) => {
        if (rule && rule.enforce === 'pre' && rule.test && String(rule.test).includes('sx')) {
          rule.exclude = [
            ...(Array.isArray(rule.exclude) ? rule.exclude : rule.exclude ? [rule.exclude] : []),
            /Canvas\.tsx$/,
          ];
        }
      });
    }
    return config;
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

const configWithPWA = withPWA(nextConfig);
const baseConfig = process.env.NODE_ENV === 'development' ? withReticle(configWithPWA) : configWithPWA;

const origWebpack = baseConfig.webpack;
baseConfig.webpack = (config, ctx) => {
  const res = origWebpack ? origWebpack(config, ctx) : config;
  console.log(`=== WEBPACK COMPILATION [name: ${ctx.name || 'unknown'}, runtime: ${ctx.nextRuntime || 'none'}, dev: ${ctx.dev}] devtool before: ${res.devtool}`);
  
  // Unconditionally force devtool to false across ALL build targets:
  res.devtool = false;

  if (Array.isArray(res.plugins)) {
    res.plugins = res.plugins.filter((p) => {
      const pName = p && p.constructor && p.constructor.name;
      if (pName && (pName.includes('Eval') || pName.includes('SourceMap'))) {
        console.log(`=== REMOVING WEBPACK PLUGIN: ${pName}`);
        return false;
      }
      return true;
    });
  }
  console.log(`=== WEBPACK COMPILATION [name: ${ctx.name || 'unknown'}] devtool after: ${res.devtool}`);
  return res;
};

export default baseConfig;
