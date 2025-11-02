/**
 * Email Service
 * שירות ראשי לשליחת אימיילים
 * תמיכה מלאה ב-RTL ועברית/אנגלית
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { emailConfig, defaultFrom, validateEmailConfig } from './config';
import type { EmailOptions, SendEmailResult } from '@/types/email.types';
import { emailLogger } from './email-logger';

class EmailService {
  private transporter: Transporter | null = null;

  /**
   * אתחול ה-transporter
   */
  private async initialize(): Promise<void> {
    if (this.transporter) {
      console.log('📮 [EMAIL SERVICE] Transporter already initialized');
      return;
    }

    console.log('📮 [EMAIL SERVICE] Initializing transporter...');
    console.log('📮 [EMAIL SERVICE] Email config:', {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      hasAuth: !!emailConfig.auth,
      hasUser: !!emailConfig.auth?.user,
      hasPass: !!emailConfig.auth?.pass
    });

    // אימות הגדרות
    if (!validateEmailConfig()) {
      console.error('❌ [EMAIL SERVICE] Email configuration is invalid!');
      throw new Error('Email configuration is invalid');
    }

    console.log('✅ [EMAIL SERVICE] Email configuration validated');

    // יצירת transporter
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });

    // אימות חיבור (אופציונלי - רק ב-development)
    if (process.env.NODE_ENV === 'development') {
      try {
        await this.transporter.verify();
        console.log('✅ Email service is ready');
      } catch (error) {
        console.error('❌ Email service connection failed:', error);
        throw error;
      }
    }
  }

  /**
   * שליחת אימייל בסיסי
   */
  async sendEmail(
    options: EmailOptions,
    metadata?: {
      emailType?: string;
      caseId?: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<SendEmailResult> {
    // Extract primary recipient for logging
    const primaryRecipient = Array.isArray(options.to)
      ? typeof options.to[0] === 'string'
        ? options.to[0]
        : options.to[0].email
      : typeof options.to === 'string'
        ? options.to
        : options.to.email;

    console.log('📮 [EMAIL SERVICE] sendEmail called');
    console.log('📮 [EMAIL SERVICE] Options:', {
      to: options.to,
      subject: options.subject,
      hasHtml: !!options.html,
      hasText: !!options.text
    });
    console.log('📮 [EMAIL SERVICE] Metadata:', metadata);

    try {
      // אתחול אם צריך
      console.log('📮 [EMAIL SERVICE] Calling initialize...');
      await this.initialize();

      if (!this.transporter) {
        console.error('❌ [EMAIL SERVICE] Transporter is not initialized after initialize()!');
        throw new Error('Email transporter is not initialized');
      }

      console.log('✅ [EMAIL SERVICE] Transporter is ready');

      // the from address
      const from = options.from || defaultFrom;
      console.log('📮 [EMAIL SERVICE] From address:', from);

      // sending the email
      console.log('📮 [EMAIL SERVICE] Sending email via nodemailer...');
      const info = await this.transporter.sendMail({
        from: typeof from === 'string' ? from : `${from.name} <${from.email}>`,
        to: this.formatAddresses(options.to),
        cc: options.cc ? this.formatAddresses(options.cc) : undefined,
        bcc: options.bcc ? this.formatAddresses(options.bcc) : undefined,
        replyTo: options.replyTo
          ? this.formatAddresses(options.replyTo)
          : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      });

      console.log('✅ [EMAIL SERVICE] Email sent successfully!');
      console.log('✅ [EMAIL SERVICE] Message ID:', info.messageId);
      console.log('✅ [EMAIL SERVICE] Response:', info.response);

      // רישום ב-database
      console.log('📮 [EMAIL SERVICE] Logging success to database...');
      await emailLogger.logSuccess(
        metadata?.emailType || 'general',
        primaryRecipient,
        options.subject,
        info.messageId,
        metadata?.caseId,
        metadata?.additionalData
      );

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('❌ [EMAIL SERVICE] Failed to send email!');
      console.error('❌ [EMAIL SERVICE] Error:', error);
      console.error('❌ [EMAIL SERVICE] Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('❌ [EMAIL SERVICE] Error stack:', error instanceof Error ? error.stack : 'N/A');

      // רישום כשל ב-database
      console.log('📮 [EMAIL SERVICE] Logging failure to database...');
      await emailLogger.logFailure(
        metadata?.emailType || 'general',
        primaryRecipient,
        options.subject,
        error instanceof Error ? error.message : 'Unknown error',
        metadata?.caseId,
        metadata?.additionalData
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * שליחת אימייל עם template
   * (ישולב עם מערכת ה-templates)
   */
  async sendTemplateEmail(
    to: string | string[],
    templateName: string,
    data: Record<string, any>
  ): Promise<SendEmailResult> {
    // TODO: integrate with template system (will add locale parameter when implemented)
    console.log('Template email will be implemented with template system', {
      to,
      templateName,
      data,
    });
    return {
      success: false,
      error: 'Template system not yet implemented',
    };
  }

  /**
   * עיצוב כתובות מייל
   */
  private formatAddresses(
    addresses: string | { email: string; name?: string } | Array<string | { email: string; name?: string }>
  ): string {
    if (typeof addresses === 'string') {
      return addresses;
    }

    if (Array.isArray(addresses)) {
      return addresses
        .map((addr) => {
          if (typeof addr === 'string') return addr;
          return addr.name ? `${addr.name} <${addr.email}>` : addr.email;
        })
        .join(', ');
    }

    return addresses.name
      ? `${addresses.name} <${addresses.email}>`
      : addresses.email;
  }

  /**
   * בדיקת תקינות המערכת
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch {
      return false;
    }
  }
}

// יצירת instance יחיד (singleton)
export const emailService = new EmailService();
