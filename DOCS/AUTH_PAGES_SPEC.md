# 🔐 אפיון דפי Authentication - Reset Password & User Invitation

**תאריך:** 2025-10-26
**גרסה:** 1.0
**סטטוס:** Ready for Development

---

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [דף User Invitation Callback](#דף-user-invitation-callback)
3. [דף Reset Password](#דף-reset-password)
4. [שינויים נדרשים ב-Schema](#שינויים-נדרשים-ב-schema)
5. [תרגומים נדרשים](#תרגומים-נדרשים)
6. [API Routes נדרשים](#api-routes-נדרשים)

---

## 🎯 סקירה כללית

### הבעיה הנוכחית

1. כשמנהל מזמין משתמש → נשלח מייל עם קישור ל-`/auth/callback` → **הדף לא קיים (404)**
2. כשמנהל שולח reset password → נשלח מייל עם קישור ל-`/auth/reset-password` → **הדף לא קיים (404)**
3. המשתמש נוצר מיד ב-database עם status='active' אבל לא יכול להיכנס כי אין לו סיסמה

### הפתרון

נבנה 2 pages:
- `/auth/callback` - טיפול בהזמנת משתמש חדש (set password)
- `/auth/reset-password` - איפוס סיסמה

שני הדפים יהיו:
- ✅ מחוץ ל-dashboard layout (public pages)
- ✅ עם עיצוב מקצועי לפי DESIGN_SYSTEM.md
- ✅ תמיכה ב-i18n (עברית/אנגלית)
- ✅ RTL support
- ✅ Error handling מלא
- ✅ Loading states

---

## 📄 דף User Invitation Callback

### 🎯 מטרה

דף זה מאפשר למשתמש שהוזמן למערכת להגדיר סיסמה ולהשלים את תהליך ההרשמה.

### 📍 Path

```
/auth/callback
```

### 🔄 Flow מלא

#### שלב 1: משתמש לוחץ על הקישור במייל

```
URL מגיע מ-Supabase:
https://yourdomain.com/auth/callback?token_hash=abc123&type=invite&next=/
```

#### שלב 2: הדף נטען

1. הדף מזהה את ה-`type=invite` בURL
2. מציג טופס להגדרת סיסמה
3. מציג את שם המשתמש ואימייל (מתוך ה-session)

#### שלב 3: משתמש מזין סיסמה

```tsx
- שדה: "סיסמה חדשה" (password input)
- שדה: "אימות סיסמה" (password input)
- כפתור: "הגדר סיסמה והתחבר"
```

#### שלב 4: Validation

```typescript
const passwordSchema = z.object({
  password: z.string()
    .min(8, t('validation.passwordMinLength'))
    .regex(/[A-Z]/, t('validation.passwordUppercase'))
    .regex(/[a-z]/, t('validation.passwordLowercase'))
    .regex(/[0-9]/, t('validation.passwordNumber')),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: t('validation.passwordsDoNotMatch'),
  path: ['confirmPassword']
});
```

#### שלב 5: שליחה לשרת

```typescript
// Client-side
const { error } = await supabase.auth.updateUser({
  password: values.password
});

if (!error) {
  // עדכון ה-profile ל-status='active' אם צריך
  // redirect ל-dashboard
}
```

#### שלב 6: Redirect

```
Success → redirect to /he/dashboard (or /en/dashboard)
Error → show error message, allow retry
```

---

### 🎨 UI/UX Design

#### Layout Structure

```tsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
  <Card className="w-full max-w-md shadow-2xl border-2">
    <CardHeader className="text-center space-y-2 pb-6">
      {/* Logo */}
      <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
        <UserPlus className="h-8 w-8 text-white" />
      </div>

      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        {t('auth.invitation.title')}
      </CardTitle>

      <CardDescription className="text-base">
        {t('auth.invitation.description')}
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">
      {/* User Info Display */}
      <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4 space-y-2">
        <p className="text-sm text-blue-900 font-semibold">
          {t('auth.invitation.welcomeUser', { name: userName })}
        </p>
        <p className="text-xs text-blue-600">
          {t('auth.invitation.email')}: {userEmail}
        </p>
      </div>

      {/* Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  {t('auth.password')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    className="border-2 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {t('auth.passwordRequirements')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  {t('auth.confirmPassword')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    className="border-2 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Check className="me-2 h-4 w-4" />
                {t('auth.invitation.submit')}
              </>
            )}
          </Button>
        </form>
      </Form>
    </CardContent>
  </Card>
</div>
```

---

### 💻 Implementation Details

#### File Structure

```
src/app/[locale]/auth/callback/
├── page.tsx              # Main page component
└── _components/
    ├── InvitationForm.tsx
    └── SetPasswordForm.tsx
```

#### page.tsx

```typescript
import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { CallbackHandler } from './_components/CallbackHandler';

export default async function CallbackPage() {
  const locale = await getLocale();
  const t = await getTranslations('auth');

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
```

#### CallbackHandler.tsx (Client Component)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { SetPasswordForm } from './SetPasswordForm';
import { ErrorDisplay } from './ErrorDisplay';

export function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const type = searchParams.get('type');

    if (type === 'invite') {
      // Handle invitation
      handleInvitation();
    } else {
      // Redirect to login or handle other types
      router.push('/login');
    }
  }, [searchParams]);

  const handleInvitation = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        throw new Error('No active session');
      }

      setSession(session);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!session) return <ErrorDisplay error="No session found" />;

  return <SetPasswordForm session={session} />;
}
```

---

## 🔑 דף Reset Password

### 🎯 מטרה

דף זה מאפשר למשתמש לאפס את הסיסמה שלו לאחר שקיבל מייל איפוס.

### 📍 Path

```
/auth/reset-password
```

### 🔄 Flow מלא

#### שלב 1: משתמש לוחץ על הקישור במייל

```
URL מגיע מ-Supabase:
https://yourdomain.com/auth/reset-password?token_hash=xyz789&type=recovery
```

#### שלב 2: הדף נטען

1. הדף מזהה את ה-`type=recovery` בURL
2. מציג טופס לאיפוס סיסמה
3. מציג את האימייל (מתוך ה-session)

#### שלב 3: משתמש מזין סיסמה חדשה

```tsx
- שדה: "סיסמה חדשה" (password input)
- שדה: "אימות סיסמה" (password input)
- כפתור: "איפוס סיסמה"
```

#### שלב 4: Validation

אותו validation כמו ב-invitation (ראה למעלה)

#### שלב 5: שליחה לשרת

```typescript
const { error } = await supabase.auth.updateUser({
  password: values.password
});

if (!error) {
  toast.success(t('auth.resetPassword.success'));
  router.push('/login');
}
```

#### שלב 6: Redirect

```
Success → redirect to /login with success message
Error → show error message, allow retry
```

---

### 🎨 UI/UX Design

#### Layout Structure

```tsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
  <Card className="w-full max-w-md shadow-2xl border-2">
    <CardHeader className="text-center space-y-2 pb-6">
      {/* Logo */}
      <div className="mx-auto h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
        <KeyRound className="h-8 w-8 text-white" />
      </div>

      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
        {t('auth.resetPassword.title')}
      </CardTitle>

      <CardDescription className="text-base">
        {t('auth.resetPassword.description')}
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">
      {/* Email Display */}
      <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-semibold">
          {t('auth.resetPassword.emailLabel')}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {userEmail}
        </p>
      </div>

      {/* Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  {t('auth.newPassword')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder={t('auth.newPasswordPlaceholder')}
                    className="border-2 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {t('auth.passwordRequirements')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">
                  {t('auth.confirmPassword')} <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    className="border-2 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Check className="me-2 h-4 w-4" />
                {t('auth.resetPassword.submit')}
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Back to Login Link */}
      <div className="text-center pt-4 border-t">
        <a
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline"
        >
          {t('auth.backToLogin')}
        </a>
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 🗄️ שינויים נדרשים ב-Schema

### הוספת שדה email_confirmed

**אופציונלי** - Supabase Auth כבר מנהל את זה דרך `email_confirmed_at`

אבל אם רוצים tracking נוסף:

```sql
-- הוספת שדה ב-profiles
ALTER TABLE public.profiles ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE;

-- עדכון trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email, email_confirmed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'secretary'),
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### הוספת שדה status

כבר קיים! אבל צריך לוודא שה-trigger מגדיר אותו נכון:

```sql
-- עדכון trigger להגדיר status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'secretary'),
    NEW.email,
    'active' -- או 'pending' אם רוצים שיהיה pending עד שמגדיר סיסמה
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🌍 תרגומים נדרשים

### messages/he.json

```json
{
  "auth": {
    "invitation": {
      "title": "ברוכים הבאים למערכת",
      "description": "הוזמנת להצטרף למערכת. אנא הגדר סיסמה להמשך.",
      "welcomeUser": "שלום {name}!",
      "email": "אימייל",
      "submit": "הגדר סיסמה והתחבר"
    },
    "resetPassword": {
      "title": "איפוס סיסמה",
      "description": "הזן סיסמה חדשה עבור חשבונך",
      "emailLabel": "איפוס סיסמה עבור:",
      "submit": "אפס סיסמה",
      "success": "הסיסמה אופסה בהצלחה! מועבר לדף התחברות..."
    },
    "password": "סיסמה",
    "newPassword": "סיסמה חדשה",
    "confirmPassword": "אימות סיסמה",
    "passwordPlaceholder": "הזן סיסמה בת 8 תווים לפחות",
    "newPasswordPlaceholder": "הזן סיסמה חדשה",
    "confirmPasswordPlaceholder": "הזן שוב את הסיסמה",
    "passwordRequirements": "לפחות 8 תווים, אות גדולה, אות קטנה ומספר",
    "backToLogin": "חזרה להתחברות",
    "errors": {
      "invalidToken": "הקישור לא תקף או פג תוקפו",
      "noSession": "לא נמצאה סשן פעיל",
      "passwordMismatch": "הסיסמאות אינן תואמות",
      "weakPassword": "הסיסמה חלשה מדי",
      "serverError": "שגיאת שרת, נסה שוב מאוחר יותר"
    }
  },
  "validation": {
    "passwordMinLength": "הסיסמה חייבת להכיל לפחות 8 תווים",
    "passwordUppercase": "הסיסמה חייבת להכיל לפחות אות גדולה אחת",
    "passwordLowercase": "הסיסמה חייבת להכיל לפחות אות קטנה אחת",
    "passwordNumber": "הסיסמה חייבת להכיל לפחות ספרה אחת",
    "passwordsDoNotMatch": "הסיסמאות אינן תואמות"
  }
}
```

### messages/en.json

```json
{
  "auth": {
    "invitation": {
      "title": "Welcome to the System",
      "description": "You've been invited to join the system. Please set a password to continue.",
      "welcomeUser": "Hello {name}!",
      "email": "Email",
      "submit": "Set Password and Login"
    },
    "resetPassword": {
      "title": "Reset Password",
      "description": "Enter a new password for your account",
      "emailLabel": "Resetting password for:",
      "submit": "Reset Password",
      "success": "Password reset successfully! Redirecting to login..."
    },
    "password": "Password",
    "newPassword": "New Password",
    "confirmPassword": "Confirm Password",
    "passwordPlaceholder": "Enter at least 8 characters",
    "newPasswordPlaceholder": "Enter new password",
    "confirmPasswordPlaceholder": "Re-enter password",
    "passwordRequirements": "At least 8 characters, uppercase, lowercase and number",
    "backToLogin": "Back to Login",
    "errors": {
      "invalidToken": "Invalid or expired link",
      "noSession": "No active session found",
      "passwordMismatch": "Passwords do not match",
      "weakPassword": "Password is too weak",
      "serverError": "Server error, please try again later"
    }
  },
  "validation": {
    "passwordMinLength": "Password must be at least 8 characters",
    "passwordUppercase": "Password must contain at least one uppercase letter",
    "passwordLowercase": "Password must contain at least one lowercase letter",
    "passwordNumber": "Password must contain at least one number",
    "passwordsDoNotMatch": "Passwords do not match"
  }
}
```

---

## 🔌 API Routes נדרשים

### לא נדרש!

Supabase Auth מטפל בכל הלוגיקה:
- ✅ Validation של token
- ✅ עדכון סיסמה
- ✅ Session management

פשוט משתמשים ב-`supabase.auth.updateUser()` מה-client.

---

## 📋 Checklist לפיתוח

### Phase 1: Setup (30 דקות)

- [ ] יצירת תיקיה `src/app/[locale]/auth/`
- [ ] יצירת `callback/page.tsx`
- [ ] יצירת `reset-password/page.tsx`
- [ ] הוספת תרגומים ל-`messages/he.json` ו-`messages/en.json`

### Phase 2: Callback Page (2 שעות)

- [ ] יצירת `CallbackHandler.tsx` component
- [ ] יצירת `SetPasswordForm.tsx` component
- [ ] יצירת `ErrorDisplay.tsx` component
- [ ] יצירת `LoadingSpinner.tsx` component
- [ ] הוספת validation schema
- [ ] בדיקת flow מקצה לקצה
- [ ] בדיקת error states
- [ ] בדיקת RTL

### Phase 3: Reset Password Page (2 שעות)

- [ ] יצירת `ResetPasswordHandler.tsx` component
- [ ] יצירת `ResetPasswordForm.tsx` component
- [ ] שימוש חוזר ב-ErrorDisplay ו-LoadingSpinner
- [ ] הוספת validation schema
- [ ] בדיקת flow מקצה לקצה
- [ ] בדיקת error states
- [ ] בדיקת RTL

### Phase 4: Testing (1 שעה)

- [ ] בדיקת invitation flow (כולל שליחת מייל)
- [ ] בדיקת reset password flow (כולל שליחת מייל)
- [ ] בדיקת error cases (token expired, invalid token)
- [ ] בדיקת responsive design
- [ ] בדיקת נגישות
- [ ] בדיקה בעברית ואנגלית

### Phase 5: Documentation (30 דקות)

- [ ] תיעוד ה-flow במסמך נפרד
- [ ] הוספת screenshots
- [ ] עדכון README

---

## 🎯 סיכום

### מה בנינו

1. ✅ דף `/auth/callback` - להגדרת סיסמה ראשונית
2. ✅ דף `/auth/reset-password` - לאיפוס סיסמה
3. ✅ טפסים עם validation מלא
4. ✅ עיצוב מקצועי לפי DESIGN_SYSTEM.md
5. ✅ תמיכה ב-i18n ו-RTL
6. ✅ Error handling מקיף
7. ✅ Loading states

### מה נשאר לעשות

1. 🔨 לממש את הקוד
2. ✅ לבדוק end-to-end
3. 📧 לוודא שהמיילים מגיעים עם הקישורים הנכונים

---

**מוכן לקוד!** 🚀

האם להתחיל בכתיבת הקוד?
