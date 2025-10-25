/**
 * Welcome Email Template
 * תבנית מייל ברכה למשתמשים חדשים
 */

import { getBaseTemplate } from './base-template';

export interface WelcomeTemplateData {
  userName: string;
  userEmail: string;
  loginUrl?: string;
  locale?: 'he' | 'en';
}

export function getWelcomeTemplate(data: WelcomeTemplateData): {
  subject: string;
  html: string;
  text: string;
} {
  const locale = data.locale || 'he';

  if (locale === 'en') {
    const content = `
      <h2 style="color: #333; margin-bottom: 16px;">Hello ${data.userName}!</h2>

      <p style="margin-bottom: 16px;">
        Welcome to Simchat Zion family support system.
      </p>

      <p style="margin-bottom: 16px;">
        Your account has been created successfully with the email: <strong>${data.userEmail}</strong>
      </p>

      <p style="margin-bottom: 16px;">
        You can now log in and start managing cases and supporting families in need.
      </p>

      ${data.loginUrl ? `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; color: #555;">
            <strong>Login URL:</strong><br>
            <a href="${data.loginUrl}" style="color: #667eea; text-decoration: none;">${data.loginUrl}</a>
          </p>
        </div>
      ` : ''}

      <p style="color: #666; margin-top: 24px;">
        If you have any questions, please don't hesitate to contact us.
      </p>
    `;

    const text = `
Hello ${data.userName}!

Welcome to Simchat Zion family support system.

Your account has been created successfully with the email: ${data.userEmail}

You can now log in and start managing cases and supporting families in need.

${data.loginUrl ? `Login URL: ${data.loginUrl}` : ''}

If you have any questions, please don't hesitate to contact us.
    `.trim();

    return {
      subject: 'Welcome to Simchat Zion',
      html: getBaseTemplate({
        title: 'Welcome to Simchat Zion',
        content,
        locale: 'en',
        preheader: 'Your account has been created successfully',
        ctaButton: data.loginUrl
          ? {
              text: 'Login to System',
              url: data.loginUrl,
            }
          : undefined,
      }),
      text,
    };
  }

  // עברית (ברירת מחדל)
  const content = `
    <h2 style="color: #333; margin-bottom: 16px;">שלום ${data.userName}!</h2>

    <p style="margin-bottom: 16px;">
      ברוכים הבאים למערכת תמיכה למשפחות של שמחת ציון.
    </p>

    <p style="margin-bottom: 16px;">
      החשבון שלך נוצר בהצלחה עם כתובת המייל: <strong>${data.userEmail}</strong>
    </p>

    <p style="margin-bottom: 16px;">
      כעת תוכל להתחבר למערכת ולהתחיל לנהל תיקים ולתמוך במשפחות נזקקות.
    </p>

    ${data.loginUrl ? `
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: #555;">
          <strong>קישור להתחברות:</strong><br>
          <a href="${data.loginUrl}" style="color: #667eea; text-decoration: none;">${data.loginUrl}</a>
        </p>
      </div>
    ` : ''}

    <p style="color: #666; margin-top: 24px;">
      אם יש לך שאלות, אל תהסס לפנות אלינו.
    </p>
  `;

  const text = `
שלום ${data.userName}!

ברוכים הבאים למערכת תמיכה למשפחות של שמחת ציון.

החשבון שלך נוצר בהצלחה עם כתובת המייל: ${data.userEmail}

כעת תוכל להתחבר למערכת ולהתחיל לנהל תיקים ולתמוך במשפחות נזקקות.

${data.loginUrl ? `קישור להתחברות: ${data.loginUrl}` : ''}

אם יש לך שאלות, אל תהסס לפנות אלינו.
  `.trim();

  return {
    subject: 'ברוכים הבאים לשמחת ציון',
    html: getBaseTemplate({
      title: 'ברוכים הבאים לשמחת ציון',
      content,
      locale: 'he',
      preheader: 'החשבון שלך נוצר בהצלחה',
      ctaButton: data.loginUrl
        ? {
            text: 'התחבר למערכת',
            url: data.loginUrl,
          }
        : undefined,
    }),
    text,
  };
}
