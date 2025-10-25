/**
 * Email System - Main Export
 * נקודת כניסה מרכזית למערכת האימייל
 */

// Services
export { emailService } from './email-service';
export { emailLogger } from './email-logger';

// Configuration
export { emailConfig, defaultFrom, secretaryEmails } from './config';

// Templates
export * from './templates';

// Validation
export * from './validation';

// Auth
export {
  checkUserAuth,
  checkInternalApiKey,
  checkEmailApiAuth,
  canSendEmail,
} from './auth-middleware';

// Utils
export * from './utils';

// Types
export type {
  EmailConfig,
  EmailAddress,
  EmailAttachment,
  EmailOptions,
  EmailTemplate,
  EmailTemplateData,
  EmailTemplateName,
  SendEmailResult,
} from '@/types/email.types';
