import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'exceljs',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'date-fns',
      '@react-pdf/renderer',
      '@hebcal/core',
    ],
  },
};

export default withNextIntl(nextConfig);
