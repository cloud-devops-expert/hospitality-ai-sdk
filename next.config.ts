import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: false,
  },
  webpack: (config, { isServer }) => {
    // Handle optional brain.js peer dependency (gpu.js)
    // gpu.js is only needed for GPU-accelerated training, which we don't use
    config.resolve.alias = {
      ...config.resolve.alias,
      'gpu.js': false,
    };

    // Handle other optional native dependencies for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        // Sharp is a Node.js native module used by Transformers.js for image processing
        // It should not be bundled for the browser (we only use text models)
        sharp: false,
      };

      // Add sharp as an external to prevent webpack from trying to bundle it
      config.externals = config.externals || [];
      config.externals.push({
        sharp: 'commonjs sharp',
      });
    }

    return config;
  },
};

// Wrap with PayloadCMS
export default withPayload(nextConfig);
