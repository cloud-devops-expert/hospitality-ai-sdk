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
        // Sharp is a Node.js native module used by Transformers.js for image processing
        // It should not be bundled for the browser (we only use text models)
        sharp: false,
      };

      // Use IgnorePlugin to completely exclude sharp from the bundle
      // This is more aggressive than externals and prevents webpack from even trying to resolve it
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^sharp$/,
          contextRegExp: /./,
        })
      );
    }

    return config;
  },
};

// Wrap with PayloadCMS
export default withPayload(nextConfig);
