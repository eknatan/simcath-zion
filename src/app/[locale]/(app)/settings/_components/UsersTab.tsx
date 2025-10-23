/**
 * UsersTab Component
 * טאב ניהול משתמשים - DataTable עם חיפוש, סינון, ופעולות
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק UI של טאב משתמשים
 * - Open/Closed: ניתן להרחיב עם פעולות נוספות
 *
 * עיצוב: לפי DESIGN_SYSTEM.md
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  KeyRound,
  Search,
  Loader2,
} from 'lucide-react';
import { useUsers, useDeleteUser, useSuspendUser, useActivateUser, useSendResetPassword } from '@/lib/hooks/useUsers';
import { useIsManager } from '@/lib/hooks/useIsManager';
import { UserDialog } from './UserDialog';
import type { Profile, UserRole, UserStatus } from '@/types/user.types';
import { formatDate } from '@/lib/utils/date';

export function UsersTab() {
  const t = useTranslations();
  const { isManager, isLoading: isLoadingPermissions } = useIsManager();

  // State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>();

  // Alert dialog state
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<'delete' | 'suspend' | 'activate'>('delete');
  const [alertUser, setAlertUser] = useState<Profile | null>(null);

  // Mutations
  const deleteMutation = useDeleteUser();
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();
  const resetPasswordMutation = useSendResetPassword();

  // Data fetching
  const { data, isLoading } = useUsers({
    search: search || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 10,
  });

  // Columns definition
  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: 'name',
      header: t('users.fields.name'),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: t('users.fields.email'),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: t('users.fields.role'),
      cell: ({ row }) => {
        const role = row.original.role;
        return role === 'manager' ? (
          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600">
            {t('users.roles.manager')}
          </Badge>
        ) : (
          <Badge variant="secondary">{t('users.roles.secretary')}</Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('users.fields.status'),
      cell: ({ row }) => {
        const status = row.original.status;
        return status === 'active' ? (
          <Badge className="bg-gradient-to-r from-green-500 to-green-600">
            {t('users.statuses.active')}
          </Badge>
        ) : (
          <Badge variant="destructive">{t('users.statuses.suspended')}</Badge>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: t('users.fields.phone'),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.phone || '-'}</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: t('users.fields.createdAt'),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('users.fields.actions'),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t('users.actions.viewDetails')}</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t('users.fields.actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setDialogMode('edit');
                  setDialogOpen(true);
                }}
              >
                <Edit className="me-2 h-4 w-4" />
                {t('users.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  resetPasswordMutation.mutate(user.id);
                }}
                disabled={resetPasswordMutation.isPending}
              >
                <KeyRound className="me-2 h-4 w-4" />
                {t('users.actions.resetPassword')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === 'active' ? (
                <DropdownMenuItem
                  onClick={() => {
                    setAlertUser(user);
                    setAlertAction('suspend');
                    setAlertDialogOpen(true);
                  }}
                  className="text-orange-600"
                >
                  <UserX className="me-2 h-4 w-4" />
                  {t('users.actions.suspend')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setAlertUser(user);
                    setAlertAction('activate');
                    setAlertDialogOpen(true);
                  }}
                  className="text-green-600"
                >
                  <UserCheck className="me-2 h-4 w-4" />
                  {t('users.actions.activate')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setAlertUser(user);
                  setAlertAction('delete');
                  setAlertDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t('users.actions.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: data?.pagination.totalPages || 0,
  });

  const handleConfirmAction = async () => {
    if (!alertUser) return;

    if (alertAction === 'delete') {
      await deleteMutation.mutateAsync(alertUser.id);
    } else if (alertAction === 'suspend') {
      await suspendMutation.mutateAsync(alertUser.id);
    } else if (alertAction === 'activate') {
      await activateMutation.mutateAsync(alertUser.id);
    }
    setAlertDialogOpen(false);
    setAlertUser(null);
  };

  // Loading or no permissions
  if (isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isManager) {
    return (
      <div className="rounded-lg border-2 border-destructive/20 bg-destructive/10 p-6">
        <p className="text-center text-destructive font-semibold">
          {t('auth.errors.unauthorized')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="ps-10 border-2"
              />
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedUser(undefined);
              setDialogMode('create');
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
          >
            <UserPlus className="me-2 h-4 w-4" />
            {t('users.inviteUser')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value as UserRole | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] border-2">
              <SelectValue placeholder={t('users.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allRoles')}</SelectItem>
              <SelectItem value="secretary">{t('users.roles.secretary')}</SelectItem>
              <SelectItem value="manager">{t('users.roles.manager')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as UserStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] border-2">
              <SelectValue placeholder={t('users.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('users.statuses.active')}</SelectItem>
              <SelectItem value="suspended">{t('users.statuses.suspended')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border-2 shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-muted-foreground">{t('users.noUsers')}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {t('users.table.showing', {
              from: (page - 1) * 10 + 1,
              to: Math.min(page * 10, data.pagination.total),
              total: data.pagination.total,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
              className="border-2"
            >
              {t('users.table.previousPage')}
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {t('users.table.page', {
                  current: page,
                  total: data.pagination.totalPages,
                })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination.totalPages || isLoading}
              className="border-2"
            >
              {t('users.table.nextPage')}
            </Button>
          </div>
        </div>
      )}

      {/* User Dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        user={selectedUser}
      />

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertAction === 'delete'
                ? t('users.confirmDelete', { name: alertUser?.name || '' })
                : alertAction === 'suspend'
                  ? t('users.confirmSuspend', { name: alertUser?.name || '' })
                  : t('users.confirmActivate', { name: alertUser?.name || '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertAction === 'delete'
                ? t('users.confirmDeleteDescription')
                : alertAction === 'suspend'
                  ? t('users.confirmSuspendDescription')
                  : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending || suspendMutation.isPending || activateMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={deleteMutation.isPending || suspendMutation.isPending || activateMutation.isPending}
              className={
                alertAction === 'delete'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : alertAction === 'suspend'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
              }
            >
              {deleteMutation.isPending || suspendMutation.isPending || activateMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
