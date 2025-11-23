'use client';

import { useQuery } from '@tanstack/react-query';

// Dashboard Stats
interface DashboardStats {
  totalCases: number;
  activeCases: number;
  pendingTransfers: number;
  totalTransferred: number;
  lastMonthCases: number;
  weddingCases: number;
  cleaningCases: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Upcoming Weddings
interface UpcomingWedding {
  id: string;
  case_number: number;
  wedding_date_gregorian: string;
  wedding_date_hebrew: string;
  groom_first_name: string | null;
  groom_last_name: string | null;
  bride_first_name: string | null;
  bride_last_name: string | null;
  city: string | null;
  status: string;
  daysUntil: number;
  coupleName: string;
}

export function useUpcomingWeddings() {
  return useQuery<UpcomingWedding[]>({
    queryKey: ['upcoming-weddings'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/upcoming-weddings');
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming weddings');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Alerts
interface Alert {
  id: string;
  type: 'wedding_needs_transfer' | 'pending_applicant' | 'cleaning_missing_payment';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  caseId?: string;
  caseNumber?: number;
  applicantId?: string;
}

export function useDashboardAlerts() {
  return useQuery<Alert[]>({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Recent Activity
interface Activity {
  id: string;
  action: string;
  description: string;
  caseName: string;
  caseId: string;
  caseNumber: number;
  caseType: 'wedding' | 'cleaning';
  timestamp: string;
}

export function useRecentActivity() {
  return useQuery<Activity[]>({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-activity');
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
