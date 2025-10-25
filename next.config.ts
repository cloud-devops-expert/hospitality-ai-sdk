import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import webpack from 'webpack';

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
      };

      // Replace sharp with a mock module for browser builds
      // Sharp is a Node.js native module used by Transformers.js for image processing
      // We only use text models, so we provide a mock to prevent bundling errors
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^sharp$/,
          require.resolve('./lib/ml/mocks/sharp.js')
        )
      );
    }

    return config;
  },
};

// Wrap with PayloadCMS
export default withPayload(nextConfig);
