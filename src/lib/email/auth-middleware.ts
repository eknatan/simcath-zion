/**
 * Email API Authentication Middleware
 * בדיקת הרשאות לשליחת מיילים
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AuthResult {
  authorized: boolean;
  userId?: string;
  userRole?: string;
  error?: string;
}

/**
 * בדיקת הרשאת משתמש מחובר (Supabase Session)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function checkUserAuth(_request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authorized: false,
        error: 'Unauthorized - No valid session',
      };
    }

    // שליפת פרופיל המשתמש לבדיקת תפקיד
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      authorized: true,
      userId: user.id,
      userRole: profile?.role || 'user',
    };
  } catch (error) {
    console.error('Error in checkUserAuth:', error);
    return {
      authorized: false,
      error: 'Authentication check failed',
    };
  }
}

/**
 * בדיקת API Key פנימי (לשימוש בין שירותים)
 */
export function checkInternalApiKey(request: NextRequest): AuthResult {
  const apiKey = request.headers.get('x-internal-api-key');
  const expectedKey = process.env.INTERNAL_EMAIL_API_KEY;

  // אם לא מוגדר מפתח בסביבה, לא מאפשר שימוש בדרך זו
  if (!expectedKey) {
    return {
      authorized: false,
      error: 'Internal API key not configured',
    };
  }

  if (!apiKey || apiKey !== expectedKey) {
    return {
      authorized: false,
      error: 'Invalid or missing internal API key',
    };
  }

  return {
    authorized: true,
    userId: 'internal-service',
    userRole: 'system',
  };
}

/**
 * בדיקת הרשאות כוללת - מנסה session ואז API key
 */
export async function checkEmailApiAuth(
  request: NextRequest
): Promise<AuthResult> {
  // ניסיון ראשון: בדיקת session
  const userAuth = await checkUserAuth(request);
  if (userAuth.authorized) {
    return userAuth;
  }

  // ניסיון שני: בדיקת API key פנימי
  const apiKeyAuth = checkInternalApiKey(request);
  if (apiKeyAuth.authorized) {
    return apiKeyAuth;
  }

  // שניהם נכשלו
  return {
    authorized: false,
    error: 'Unauthorized - No valid authentication method',
  };
}

/**
 * בדיקה אם למשתמש יש הרשאה לשלוח מייל
 */
export function canSendEmail(userRole?: string): boolean {
  // רק מזכירות ומנהלים יכולים לשלוח מיילים ישירות
  const allowedRoles = ['secretary', 'admin', 'manager', 'system'];

  if (!userRole) return false;

  return allowedRoles.includes(userRole);
}
