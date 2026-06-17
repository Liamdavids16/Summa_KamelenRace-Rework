import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: '/admin.html',
        destination: '/admin',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
