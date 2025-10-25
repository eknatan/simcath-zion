/**
 * Base Email Template
 * תבנית בסיס לכל המיילים
 * תמיכה מלאה ב-RTL ועברית
 */

export interface BaseTemplateProps {
  title: string;
  content: string;
  footer?: string;
  locale?: 'he' | 'en';
  preheader?: string;
  ctaButton?: {
    text: string;
    url: string;
  };
}

/**
 * תבנית HTML בסיסית עם תמיכה ב-RTL
 */
export function getBaseTemplate(props: BaseTemplateProps): string {
  const dir = props.locale === 'en' ? 'ltr' : 'rtl';
  const align = props.locale === 'en' ? 'left' : 'right';

  return `
<!DOCTYPE html>
<html dir="${dir}" lang="${props.locale || 'he'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${props.locale === 'en'
        ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : '"Segoe UI", "Tahoma", "Arial", sans-serif'};
      background-color: #f5f5f5;
      direction: ${dir};
      text-align: ${align};
      line-height: 1.6;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }

    .email-header h1 {
      color: #ffffff;
      font-size: 28px;
      margin: 0;
      font-weight: 600;
    }

    .email-body {
      padding: 40px 30px;
      color: #333333;
    }

    .email-content {
      font-size: 16px;
      color: #555555;
      line-height: 1.8;
    }

    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
      transition: transform 0.2s;
    }

    .cta-button:hover {
      transform: translateY(-2px);
    }

    .email-footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666666;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }

    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 24px 0;
    }

    .preheader {
      display: none;
      font-size: 1px;
      color: #f5f5f5;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }

    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 30px 20px !important;
      }

      .email-header h1 {
        font-size: 24px !important;
      }
    }
  </style>
</head>
<body>
  ${props.preheader ? `<div class="preheader">${props.preheader}</div>` : ''}

  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <h1>${props.title}</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <div class="email-content">
        ${props.content}
      </div>

      ${props.ctaButton ? `
        <div style="text-align: center; margin-top: 32px;">
          <a href="${props.ctaButton.url}" class="cta-button">
            ${props.ctaButton.text}
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="email-footer">
      ${props.footer || (props.locale === 'en'
        ? 'Simchat Zion - Supporting Families in Need'
        : 'שמחת ציון - תמיכה למשפחות נזקקות')}
      <div class="divider"></div>
      <p style="font-size: 12px; color: #999999; margin-top: 16px;">
        ${props.locale === 'en'
          ? 'This email was sent from Simchat Zion system'
          : 'אימייל זה נשלח ממערכת שמחת ציון'}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * המרת תוכן טקסט ל-HTML עם פסקאות
 */
export function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .map((paragraph) => `<p style="margin-bottom: 16px;">${paragraph}</p>`)
    .join('');
}
