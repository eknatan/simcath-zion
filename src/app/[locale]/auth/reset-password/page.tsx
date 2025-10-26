/**
 * Reset Password Page
 * דף איפוס סיסמה
 *
 * Flow:
 * 1. User clicks "reset password" link in email
 * 2. Supabase redirects to this page with token_hash & type=recovery
 * 3. ResetPasswordHandler validates the session and shows the form
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק rendering של reset password handler
 */

import { Suspense } from 'react';
import { ResetPasswordHandler } from './_components/ResetPasswordHandler';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export const metadata = {
  title: 'Reset Password | Family Support System',
  description: 'Reset your password',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordHandler />
    </Suspense>
  );
}
