/**
 * useIsManager Hook
 *
 * בדיקת הרשאות - האם המשתמש הנוכחי הוא מנהל
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק בדיקת role
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

export function useIsManager() {
  const { user } = useAuth();

  const { data: profile, isLoading: isQueryLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error; // Throw error so query knows it failed
      }

      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - role לא משתנה הרבה
    retry: 1, // Only retry once on failure
  });

  return {
    isManager: profile?.role === 'manager' && profile?.status === 'active',
    role: profile?.role,
    status: profile?.status,
    isLoading: isQueryLoading,
    error,
  };
}
