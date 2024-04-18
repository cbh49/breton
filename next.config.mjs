// next.config.mjs

// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Enable image optimization for external sources
  images: {
    domains: ['cdn.freebiesupply.com', 'seeklogo.com'],
  },

  // Add a rewrites function if you need to redirect old URLs or pattern match
  async rewrites() {
    return [
      // Example rewrite: Redirect from old-blog/:slug to new-blog/:slug
      // {
      //   source: '/old-blog/:slug*',
      //   destination: '/new-blog/:slug*', // Adjustment for dynamic paths
      // },
    ];
  },

  // Headers example, you can set custom headers for your application
  async headers() {
    return [
      {
        source: "/(.*)", // Matches all pages
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Enable React Strict Mode
  reactStrictMode: true,

  // Optionally configure the build ID
  // generateBuildId: async () => {
  //   // You can, for example, get the latest git commit hash here
  //   return 'my-build-id';
  // },

  // Further custom webpack configurations could be placed here
  webpack(config, { buildId, dev, isServer, defaultLoaders, webpack }) {
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
