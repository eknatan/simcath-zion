/**
 * Custom Hook: useMonthlyCapSetting
 *
 * Hook לקבלת תקרת תשלום חודשי מה-DB עם cache
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק ניהול תקרת תשלום
 * - משתמש ב-React Query לcaching אוטומטי
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const DEFAULT_MONTHLY_CAP = 720;

// ========================================
// Query Keys
// ========================================

export const monthlyCapKeys = {
  all: ['monthlyCap'] as const,
  setting: () => [...monthlyCapKeys.all, 'setting'] as const,
};

// ========================================
// Fetcher
// ========================================

const fetchMonthlyCap = async (): Promise<number> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'cleaning_monthly_cap')
    .single();

  if (error || !data) {
    console.warn('Failed to fetch monthly cap, using default:', error);
    return DEFAULT_MONTHLY_CAP;
  }

  const value =
    typeof data.setting_value === 'number'
      ? data.setting_value
      : Number(data.setting_value);

  return value > 0 ? value : DEFAULT_MONTHLY_CAP;
};

interface UseMonthlyCapSettingReturn {
  monthlyCap: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook לקבלת תקרת תשלום חודשי
 *
 * @example
 * const { monthlyCap, isLoading } = useMonthlyCapSetting();
 *
 * // monthlyCap יהיה 720 (או ערך אחר מה-DB)
 * // הערך נשמר ב-cache למשך 5 דקות
 */
export function useMonthlyCapSetting(): UseMonthlyCapSettingReturn {
  const queryClient = useQueryClient();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: monthlyCapKeys.setting(),
    queryFn: fetchMonthlyCap,
    staleTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: DEFAULT_MONTHLY_CAP,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    monthlyCap: data ?? DEFAULT_MONTHLY_CAP,
    isLoading,
    error: error || null,
    refresh,
  };
}

// Export default value for use in non-hook contexts
export const DEFAULT_CAP = DEFAULT_MONTHLY_CAP;
