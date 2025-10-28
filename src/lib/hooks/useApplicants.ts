/**
 * useApplicants Hook
 *
 * Custom hook לניהול בקשות (applicants)
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק fetch ו-caching של applicants
 * - Dependency Inversion: משתמש ב-fetch abstraction
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface Applicant {
  id: string;
  case_type: string;
  form_data: any;
  email_sent_to_secretary: boolean | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseApplicantsOptions {
  status?: 'pending' | 'rejected';
  caseType?: 'wedding' | 'cleaning';
}

/**
 * Fetch applicants from Supabase
 */
async function fetchApplicants(options?: UseApplicantsOptions): Promise<Applicant[]> {
  let query = supabase
    .from('applicants')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (options?.caseType) {
    query = query.eq('case_type', options.caseType);
  }

  if (options?.status === 'pending') {
    query = query.eq('status', 'pending_approval');
  } else if (options?.status === 'rejected') {
    query = query.eq('status', 'rejected');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching applicants:', error);
    throw new Error(`Failed to fetch applicants: ${error.message}`);
  }

  return data || [];
}

/**
 * Hook: useApplicants
 */
export function useApplicants(options?: UseApplicantsOptions) {
  return useQuery({
    queryKey: ['applicants', options],
    queryFn: () => fetchApplicants(options),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Approve applicant
 */
async function approveApplicant(id: string): Promise<any> {
  const response = await fetch(`/api/applicants/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to approve applicant');
  }

  return response.json();
}

/**
 * Hook: useApproveApplicant
 */
export function useApproveApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveApplicant,
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
}

/**
 * Reject applicant
 */
async function rejectApplicant(data: { id: string; reason?: string }): Promise<any> {
  const response = await fetch(`/api/applicants/${data.id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason: data.reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reject applicant');
  }

  return response.json();
}

/**
 * Hook: useRejectApplicant
 */
export function useRejectApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectApplicant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
}

/**
 * Restore applicant
 */
async function restoreApplicant(id: string): Promise<any> {
  const response = await fetch(`/api/applicants/${id}/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to restore applicant');
  }

  return response.json();
}

/**
 * Hook: useRestoreApplicant
 */
export function useRestoreApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreApplicant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] });
    },
  });
}
