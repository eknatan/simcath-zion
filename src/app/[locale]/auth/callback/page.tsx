/**
 * Auth Callback Page
 * דף טיפול ב-callbacks מ-Supabase Auth
 *
 * Flow:
 * 1. User clicks link in email
 * 2. Supabase redirects to this page with token_hash & type
 * 3. CallbackHandler determines the type and shows appropriate UI
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק rendering של callback handler
 */

import { Suspense } from 'react';
import { CallbackHandler } from './_components/CallbackHandler';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export const metadata = {
  title: 'Authentication | Family Support System',
  description: 'User authentication callback',
};

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
