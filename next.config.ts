import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import webpack from 'webpack';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: false,
  },
  webpack: (config, { isServer }) => {
    // Handle other optional native dependencies for client-side builds
    if (!isServer) {
      // Use webpack aliases to replace modules for browser builds
      const sharpMockPath = path.join(__dirname, 'lib', 'ml', 'mocks', 'sharp.js');

      config.resolve.alias = {
        ...config.resolve.alias,
        'gpu.js': false,
        // Replace sharp with our mock for browser builds
        'sharp': sharpMockPath,
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    } else {
      // Server-side: keep gpu.js disabled
      config.resolve.alias = {
        ...config.resolve.alias,
        'gpu.js': false,
      };
    }

    return config;
  },
};

// Wrap with PayloadCMS
export default withPayload(nextConfig);
