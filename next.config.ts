import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: false,
    turbo: {
      // Turbopack configuration to suppress warnings
      rules: {},
    },
  },
};

// Wrap with PayloadCMS
export default withPayload(nextConfig);
