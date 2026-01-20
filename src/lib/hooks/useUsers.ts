/**
 * Users Management Hooks
 *
 * עקרונות SOLID:
 * - Single Responsibility: כל hook מטפל בפעולה אחת
 * - Dependency Inversion: לא תלוי במימוש ספציפי של API
 *
 * שימוש ב-React Query לניהול state, caching, ו-refetching
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Profile,
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  UsersResponse,
} from '@/types/user.types';

/**
 * Hook לקבלת רשימת משתמשים
 * תומך בחיפוש, סינון ו-pagination
 */
export function useUsers(filters: UserFilters = {}) {
  return useQuery<UsersResponse>({
    queryKey: ['users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.set('search', filters.search);
      if (filters.role) params.set('role', filters.role);
      if (filters.status) params.set('status', filters.status);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));

      const res = await fetch(`/api/users?${params.toString()}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook לקבלת משתמש בודד
 */
export function useUser(id: string | undefined) {
  return useQuery<Profile>({
    queryKey: ['users', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');

      const res = await fetch(`/api/users/${id}`);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch user');
      }

      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Hook להזמנת משתמש חדש
 */
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to invite user');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('משתמש הוזמן בהצלחה', {
        description: 'נשלח מייל הזמנה למשתמש',
      });
    },
    onError: (error: Error) => {
      toast.error('שגיאה', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook לעדכון משתמש קיים
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      toast.success('משתמש עודכן בהצלחה');
    },
    onError: (error: Error) => {
      toast.error('שגיאה', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook למחיקת משתמש
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('משתמש נמחק בהצלחה');
    },
    onError: (error: Error) => {
      toast.error('שגיאה', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook לשליחת לינק לאיפוס סיסמה
 */
export function useSendResetPassword() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send reset email');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('נשלח לינק לאיפוס סיסמה');
    },
    onError: (error: Error) => {
      toast.error('שגיאה', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook לקביעת סיסמה ישירות (ללא שליחת מייל)
 */
export function useSetPassword() {
  return useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const res = await fetch(`/api/users/${userId}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to set password');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('הסיסמה נקבעה בהצלחה');
    },
    onError: (error: Error) => {
      toast.error('שגיאה', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook להשהיית משתמש
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}/suspend`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to suspend user');
      }

      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      toast.success('משתמש הושהה בהצלחה');
    },
    onError: (error: Error) => {
      toast.error('שגיאה', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook להפעלת משתמש
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}/activate`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to activate user');
      }

      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      toast.success('משתמש הופעל בהצלחה');
    },
    onError: (error: Error) => {
      toast.error('שגיאה', {
        description: error.message,
      });
    },
  });
}
