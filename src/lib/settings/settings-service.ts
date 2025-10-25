/**
 * System Settings Service
 * שירות לניהול הגדרות מערכת מ-DB
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any; // JSON value
  description: string | null;
  category: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

class SettingsService {
  /**
   * שליפת הגדרה לפי מפתח
   * Note: Always uses admin client as system_settings is not in public schema types
   */
  async getSetting(key: string): Promise<any | null> {
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();

      if (error) {
        console.error(`Failed to get setting: ${key}`, error);
        return null;
      }

      return data?.setting_value || null;
    } catch (error) {
      console.error(`Error getting setting: ${key}`, error);
      return null;
    }
  }

  /**
   * שליפת כל ההגדרות
   * Note: Uses admin client as system_settings is not in public schema types
   */
  async getAllSettings(category?: string): Promise<SystemSetting[]> {
    try {
      let query = (supabaseAdmin as any)
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('setting_key', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get all settings:', error);
        return [];
      }

      return (data || []) as SystemSetting[];
    } catch (error) {
      console.error('Error getting all settings:', error);
      return [];
    }
  }

  /**
   * עדכון הגדרה
   * Note: Uses admin client as system_settings is not in public schema types
   */
  async updateSetting(
    key: string,
    value: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabaseAdmin as any)
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', key);

      if (error) {
        console.error(`Failed to update setting: ${key}`, error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error(`Error updating setting: ${key}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * יצירת הגדרה חדשה
   */
  async createSetting(
    key: string,
    value: any,
    description?: string,
    category: string = 'general'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabaseAdmin as any).from('system_settings').insert({
        setting_key: key,
        setting_value: value,
        description,
        category,
      });

      if (error) {
        console.error(`Failed to create setting: ${key}`, error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error(`Error creating setting: ${key}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // === Specific Settings Helpers ===

  /**
   * קבלת רשימת מיילי מזכירות
   */
  async getSecretaryEmails(): Promise<string[]> {
    const emails = await this.getSetting('secretary_emails');

    if (!emails || !Array.isArray(emails)) {
      // ברירת מחדל אם אין הגדרה
      return [process.env.MAIL_USER || 'secretary@example.com'];
    }

    return emails.filter((email: any) => typeof email === 'string' && email.length > 0);
  }

  /**
   * עדכון רשימת מיילי מזכירות
   */
  async updateSecretaryEmails(emails: string[]): Promise<{ success: boolean; error?: string }> {
    // ולידציה בסיסית
    const validEmails = emails.filter((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    if (validEmails.length === 0) {
      return { success: false, error: 'No valid email addresses provided' };
    }

    return this.updateSetting('secretary_emails', validEmails);
  }

  /**
   * בדיקה אם התראות מייל מופעלות
   */
  async areEmailNotificationsEnabled(): Promise<boolean> {
    const enabled = await this.getSetting('email_notifications_enabled');
    return enabled === true || enabled === 'true';
  }

  /**
   * קבלת שם הארגון
   */
  async getOrganizationName(locale: 'he' | 'en' = 'he'): Promise<string> {
    const orgName = await this.getSetting('organization_name');

    if (orgName && typeof orgName === 'object' && orgName[locale]) {
      return orgName[locale];
    }

    return locale === 'he' ? 'שמחת ציון' : 'Simchat Zion';
  }

  /**
   * קבלת מייל הארגון
   */
  async getOrganizationEmail(): Promise<string> {
    const email = await this.getSetting('organization_email');
    return email || process.env.MAIL_USER || 'simcahtziondata@gmail.com';
  }
}

// יצירת instance יחיד (singleton)
export const settingsService = new SettingsService();
