/**
 * Settings Service
 *
 * Handles reading and updating system settings from the database.
 * Provides type-safe access to different setting categories.
 */

import { createClient } from '@/lib/supabase/server';

// ========================================
// Error Types
// ========================================

export class SettingsError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SettingsError';
  }
}

// ========================================
// Settings Types
// ========================================

/**
 * MASAV Organization Settings
 */
export interface MasavOrganizationSettings {
  institution_id: string; // מספר מוסד (8 digits)
  institution_name: string; // שם המוסד
  bank_code: string; // קוד בנק (2 digits)
  branch_code: string; // קוד סניף (3 digits)
  account_number: string; // מספר חשבון
  sequence_number: string; // מספר רצף (3 digits)
}

/**
 * All system settings
 */
export interface SystemSettings {
  masav_organization: MasavOrganizationSettings;
  // Add more settings as needed
}

// ========================================
// Get Settings
// ========================================

/**
 * Get a specific setting by key
 */
export async function getSetting<K extends keyof SystemSettings>(
  settingKey: K
): Promise<SystemSettings[K] | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', settingKey)
      .single();

    if (error) {
      throw new SettingsError(
        `Failed to fetch setting: ${settingKey}`,
        'FETCH_ERROR',
        error
      );
    }

    if (!data) {
      return null;
    }

    return data.setting_value as unknown as SystemSettings[K];
  } catch (error) {
    if (error instanceof SettingsError) throw error;
    throw new SettingsError(
      `Unexpected error fetching setting: ${settingKey}`,
      'UNKNOWN_ERROR',
      error
    );
  }
}

/**
 * Get MASAV organization settings
 */
export async function getMasavOrganizationSettings(): Promise<MasavOrganizationSettings> {
  const settings = await getSetting('masav_organization');

  if (!settings) {
    throw new SettingsError(
      'MASAV organization settings not configured. Please configure in system settings.',
      'SETTINGS_NOT_FOUND'
    );
  }

  // Validate required fields
  const required = [
    'institution_id',
    'institution_name',
    'bank_code',
    'branch_code',
    'account_number',
  ];

  for (const field of required) {
    if (!settings[field as keyof MasavOrganizationSettings]) {
      throw new SettingsError(
        `Missing required MASAV setting: ${field}`,
        'INVALID_SETTINGS'
      );
    }
  }

  return settings;
}

// ========================================
// Update Settings
// ========================================

/**
 * Update a specific setting
 */
export async function updateSetting<K extends keyof SystemSettings>(
  settingKey: K,
  settingValue: SystemSettings[K],
  updatedBy: string
): Promise<void> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('system_settings')
      .update({
        setting_value: settingValue as never,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', settingKey);

    if (error) {
      throw new SettingsError(
        `Failed to update setting: ${settingKey}`,
        'UPDATE_ERROR',
        error
      );
    }
  } catch (error) {
    if (error instanceof SettingsError) throw error;
    throw new SettingsError(
      `Unexpected error updating setting: ${settingKey}`,
      'UNKNOWN_ERROR',
      error
    );
  }
}
