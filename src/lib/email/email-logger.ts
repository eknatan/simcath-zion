/**
 * Email Logger Service
 * שירות לרישום שליחות אימייל ב-Supabase
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface EmailLogData {
  caseId?: string;
  emailType: string;
  recipientEmail: string;
  subject: string;
  status: 'sent' | 'failed' | 'bounced';
  messageId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

class EmailLogger {
  /**
   * רישום שליחת מייל בטבלת email_logs
   */
  async logEmail(data: EmailLogData): Promise<void> {
    try {
      // הכנת metadata מותאם (נשמר בסכמה הקיימת אם יש, אחרת נתעד בלוגים)
      const logEntry: any = {
        case_id: data.caseId || null,
        email_type: data.emailType,
        recipient_email: data.recipientEmail,
        subject: data.subject,
        status: data.status,
        sent_at: new Date().toISOString(),
      };

      // שדות נוספים שאולי לא קיימים בטבלה - נוסיף רק אם הטבלה תומכת
      // אחרת נשמור ב-console.log
      const additionalData = {
        messageId: data.messageId,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
      };

      const { error } = await supabaseAdmin.from('email_logs').insert(logEntry);

      if (error) {
        console.error('❌ Failed to log email to database:', error);
        console.error('Additional data (not saved):', additionalData);
        // לא זורקים שגיאה - לא רוצים שכשל בלוג יעצור את התהליך
      } else {
        console.log('✅ Email logged to database:', data.recipientEmail);
        if (data.messageId || data.errorMessage || data.metadata) {
          console.log('📋 Additional metadata:', additionalData);
        }
      }
    } catch (error) {
      console.error('❌ Error logging email:', error);
      // Silent fail - logging shouldn't break the flow
    }
  }

  /**
   * רישום שליחה מוצלחת
   */
  async logSuccess(
    emailType: string,
    recipientEmail: string,
    subject: string,
    messageId: string,
    caseId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEmail({
      caseId,
      emailType,
      recipientEmail,
      subject,
      status: 'sent',
      messageId,
      metadata,
    });
  }

  /**
   * רישום כשל בשליחה
   */
  async logFailure(
    emailType: string,
    recipientEmail: string,
    subject: string,
    errorMessage: string,
    caseId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEmail({
      caseId,
      emailType,
      recipientEmail,
      subject,
      status: 'failed',
      errorMessage,
      metadata,
    });
  }

  /**
   * רישום bounce (מייל חזר)
   */
  async logBounce(
    emailType: string,
    recipientEmail: string,
    subject: string,
    caseId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEmail({
      caseId,
      emailType,
      recipientEmail,
      subject,
      status: 'bounced',
      metadata,
    });
  }

  /**
   * שליפת היסטוריית מיילים לתיק
   */
  async getEmailHistory(caseId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_logs')
        .select('*')
        .eq('case_id', caseId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch email history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching email history:', error);
      return [];
    }
  }

  /**
   * שליפת סטטיסטיקות שליחות
   */
  async getEmailStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    sent: number;
    failed: number;
    bounced: number;
  }> {
    try {
      let query = supabaseAdmin.from('email_logs').select('status', { count: 'exact' });

      if (startDate) {
        query = query.gte('sent_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('sent_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch email stats:', error);
        return { total: 0, sent: 0, failed: 0, bounced: 0 };
      }

      const stats = {
        total: data?.length || 0,
        sent: data?.filter((log) => log.status === 'sent').length || 0,
        failed: data?.filter((log) => log.status === 'failed').length || 0,
        bounced: data?.filter((log) => log.status === 'bounced').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('❌ Error fetching email stats:', error);
      return { total: 0, sent: 0, failed: 0, bounced: 0 };
    }
  }
}

// יצירת instance יחיד (singleton)
export const emailLogger = new EmailLogger();
