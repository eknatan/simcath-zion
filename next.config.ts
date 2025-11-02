import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  // Note: removeConsole disabled temporarily for debugging email issues
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === 'production',
  // },

  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
};

export default withNextIntl(nextConfig);
