/**
 * Email System Types
 * תמיכה מלאה בעברית ואנגלית
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface EmailOptions {
  to: string | EmailAddress | Array<string | EmailAddress>;
  subject: string;
  text?: string;
  html?: string;
  from?: string | EmailAddress;
  cc?: string | EmailAddress | Array<string | EmailAddress>;
  bcc?: string | EmailAddress | Array<string | EmailAddress>;
  replyTo?: string | EmailAddress;
  attachments?: EmailAttachment[];
  locale?: 'he' | 'en';
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateData {
  [key: string]: any;
}

export type EmailTemplateName =
  | 'welcome'
  | 'case-created'
  | 'case-approved'
  | 'case-rejected'
  | 'payment-transferred'
  | 'applicant-notification'
  | 'custom';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
