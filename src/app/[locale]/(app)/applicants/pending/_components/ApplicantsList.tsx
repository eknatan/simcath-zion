'use client';

/**
 * ApplicantsList
 *
 * טבלה עם רשימת בקשות + פעולות
 * משתמשת ב-DataTable משותף + דיאלוגים
 *
 * Features:
 * - סינונים וחיפוש
 * - צפייה בבקשה (Dialog)
 * - אישור / דחייה
 * - שחזור (עבור נדחות)
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable/DataTable';
import { ActionButton } from '@/components/shared/ActionButton';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Applicant } from '@/lib/hooks/useApplicants';
import { ApplicantViewDialog } from './ApplicantViewDialog';
import { ApproveDialog } from './ApproveDialog';
import { RejectDialog } from './RejectDialog';
import { RestoreDialog } from './RestoreDialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ApplicantsListProps {
  applicants: Applicant[];
  status: 'pending' | 'rejected';
  onRefresh: () => void;
  locale: string;
  searchQuery: string;
}

export function ApplicantsList({
  applicants,
  status,
  onRefresh,
  locale,
  searchQuery,
}: ApplicantsListProps) {
  const t = useTranslations('applicants');
  const router = useRouter();

  // State
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // Filter applicants
  const filteredApplicants = useMemo(() => {
    if (!searchQuery) return applicants;

    const query = searchQuery.toLowerCase();
    return applicants.filter((app) => {
      const formData = app.form_data as any;
      const groomName = `${formData.groom_info?.first_name} ${formData.groom_info?.last_name}`.toLowerCase();
      const brideName = `${formData.bride_info?.first_name} ${formData.bride_info?.last_name}`.toLowerCase();
      const city = formData.wedding_info?.city?.toLowerCase() || '';

      return groomName.includes(query) || brideName.includes(query) || city.includes(query);
    });
  }, [applicants, searchQuery]);

  // Helper: Format date
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', {
        locale: locale === 'he' ? he : undefined,
      });
    } catch {
      return dateString;
    }
  }, [locale]);

  // Helper: Get applicant names
  const getApplicantNames = (applicant: Applicant) => {
    const formData = applicant.form_data as any;
    if (applicant.case_type === 'wedding') {
      const groomName = `${formData.groom_info?.first_name || ''} ${formData.groom_info?.last_name || ''}`.trim();
      const brideName = `${formData.bride_info?.first_name || ''} ${formData.bride_info?.last_name || ''}`.trim();
      return { groom: groomName || '-', bride: brideName || '-' };
    }
    return { groom: '-', bride: '-' };
  };

  // Helper: Get wedding date
  const getWeddingDate = (applicant: Applicant) => {
    const formData = applicant.form_data as any;
    const hebrewDate = formData.wedding_info?.date_hebrew || '';
    const gregorianDate = formData.wedding_info?.date_gregorian || '';
    return { hebrew: hebrewDate, gregorian: gregorianDate };
  };

  // Helper: Get status badge (Version B - Soft)
  const getStatusBadge = useCallback((applicant: Applicant) => {
    const appStatus = applicant.status || 'pending_approval';

    if (appStatus === 'pending_approval' || !applicant.status) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-medium">
          {t('status.pending')}
        </Badge>
      );
    }

    if (appStatus === 'approved') {
      return (
        <Badge className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 text-xs font-medium">
          {t('status.approved')}
        </Badge>
      );
    }

    if (appStatus === 'rejected') {
      return (
        <Badge className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 text-xs font-medium">
          {t('status.rejected')}
        </Badge>
      );
    }

    return null;
  }, [t]);

  // Helper: Calculate days left (for rejected)
  const getDaysLeft = (applicant: Applicant) => {
    const formData = applicant.form_data as any;
    const rejectedAt = formData?.rejected_at;
    if (!rejectedAt) return null;

    const now = new Date();
    const rejectionDate = new Date(rejectedAt);
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now.getTime() - rejectionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 0;
    return diffDays;
  };

  // Columns definition
  const columns: ColumnDef<Applicant>[] = useMemo(
    () => [
      {
        accessorKey: 'created_at',
        header: t('table.date_received'),
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: 'groom_name',
        header: t('table.groom_name'),
        cell: ({ row }) => {
          const names = getApplicantNames(row.original);
          return names.groom;
        },
      },
      {
        id: 'bride_name',
        header: t('table.bride_name'),
        cell: ({ row }) => {
          const names = getApplicantNames(row.original);
          return names.bride;
        },
      },
      {
        id: 'wedding_date',
        header: t('table.wedding_date'),
        cell: ({ row }) => {
          const dates = getWeddingDate(row.original);
          if (!dates.hebrew && !dates.gregorian) return '-';
          return (
            <div>
              <div className="font-medium">{dates.hebrew}</div>
              <div className="text-xs text-muted-foreground">{dates.gregorian}</div>
            </div>
          );
        },
      },
      {
        id: 'city',
        header: t('table.city'),
        cell: ({ row }) => {
          const formData = row.original.form_data as any;
          return formData.wedding_info?.city || '-';
        },
      },
      {
        id: 'guests_count',
        header: t('table.guests_count'),
        cell: ({ row }) => {
          const formData = row.original.form_data as any;
          return formData.wedding_info?.guests_count || '-';
        },
      },
      {
        id: 'status',
        header: t('table.status'),
        cell: ({ row }) => getStatusBadge(row.original),
      },
      // Days left (only for rejected) - Version B
      ...(status === 'rejected'
        ? [
            {
              id: 'days_left',
              header: t('table.days_left'),
              cell: ({ row }: any) => {
                const daysLeft = getDaysLeft(row.original);
                if (daysLeft === null) return '-';

                let badgeClass = 'bg-green-100 text-green-700 border border-green-200';
                if (daysLeft < 20 && daysLeft >= 10) {
                  badgeClass = 'bg-amber-100 text-amber-700 border border-amber-200';
                } else if (daysLeft < 10) {
                  badgeClass = 'bg-red-100 text-red-700 border border-red-200';
                }

                return (
                  <Badge className={`${badgeClass} px-3 py-1 text-xs font-medium`}>
                    {daysLeft} {t('days')}
                  </Badge>
                );
              },
            },
          ]
        : []),
      {
        id: 'actions',
        header: t('table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-2">
            {/* View Button */}
            <ActionButton
              variant="view"
              size="sm"
              onClick={() => {
                setSelectedApplicant(row.original);
                setViewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4 me-1" />
              {t('actions.view')}
            </ActionButton>

            {/* Approve Button (only for pending) */}
            {status === 'pending' && (
              <ActionButton
                variant="approve"
                size="sm"
                onClick={() => {
                  setSelectedApplicant(row.original);
                  setApproveDialogOpen(true);
                }}
              >
                <CheckCircle2 className="h-4 w-4 me-1" />
                {t('actions.approve')}
              </ActionButton>
            )}

            {/* Reject Button (only for pending) */}
            {status === 'pending' && (
              <ActionButton
                variant="reject"
                size="sm"
                onClick={() => {
                  setSelectedApplicant(row.original);
                  setRejectDialogOpen(true);
                }}
              >
                <XCircle className="h-4 w-4 me-1" />
                {t('actions.reject')}
              </ActionButton>
            )}

            {/* Restore Button (only for rejected) */}
            {status === 'rejected' && (
              <ActionButton
                variant="restore"
                size="sm"
                onClick={() => {
                  setSelectedApplicant(row.original);
                  setRestoreDialogOpen(true);
                }}
              >
                <RotateCcw className="h-4 w-4 me-1" />
                {t('actions.restore')}
              </ActionButton>
            )}
          </div>
        ),
      },
    ],
    [status, t, formatDate, getStatusBadge]
  );

  return (
    <div className="space-y-4">
      {/* Table */}
      <DataTable columns={columns} data={filteredApplicants} />

      {/* Dialogs */}
      {selectedApplicant && (
        <>
          <ApplicantViewDialog
            applicant={selectedApplicant}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            locale={locale}
          />
          <ApproveDialog
            applicant={selectedApplicant}
            open={approveDialogOpen}
            onOpenChange={setApproveDialogOpen}
            onSuccess={(caseId) => {
              onRefresh();
              router.push(`/${locale}/cases/${caseId}`);
            }}
            locale={locale}
          />
          <RejectDialog
            applicant={selectedApplicant}
            open={rejectDialogOpen}
            onOpenChange={setRejectDialogOpen}
            onSuccess={() => {
              onRefresh();
            }}
            locale={locale}
          />
          <RestoreDialog
            applicant={selectedApplicant}
            open={restoreDialogOpen}
            onOpenChange={setRestoreDialogOpen}
            onSuccess={() => {
              onRefresh();
            }}
            locale={locale}
          />
        </>
      )}
    </div>
  );
}
