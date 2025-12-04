import type { Payment } from '@/types/case.types';

/**
 * Hebrew month names - shared constant
 * Moved outside components to avoid recreation on each render (ISSUE-013)
 */
export const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
] as const;

/**
 * Payment form values - used for both add and edit
 */
export interface PaymentFormValues {
  month: string;
  year: string;
  amount: string;
  notes: string;
}

/**
 * Return type for useCleaningPayments hook
 */
export interface UseCleaningPaymentsReturn {
  // Data
  payments: Payment[];
  filteredPayments: Payment[];
  monthlyCap: number;
  filteredTotal: number;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;

  // Filter
  filterYear: string;
  setFilterYear: (year: string) => void;

  // Actions
  addPayment: (values: PaymentFormValues) => Promise<boolean>;
  updatePayment: (id: string, values: PaymentFormValues) => Promise<boolean>;
  deletePayment: (id: string) => Promise<boolean>;
  refetch: () => Promise<unknown>;

  // Utilities
  formatPaymentMonth: (dateStr: string) => string;
  years: string[];
}

/**
 * Props for PaymentForm component
 */
export interface PaymentFormProps {
  onSubmit: (values: PaymentFormValues) => Promise<boolean>;
  isSaving: boolean;
  monthlyCap: number;
  years: string[];
}

/**
 * Props for PaymentsTable component
 */
export interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
  formatPaymentMonth: (dateStr: string) => string;
}

/**
 * Props for EditPaymentDialog component
 */
export interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onSave: (id: string, values: PaymentFormValues) => Promise<boolean>;
  isSaving: boolean;
  years: string[];
  monthlyCap: number;
}

/**
 * Props for DeletePaymentDialog component
 */
export interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

/**
 * Props for PaymentFilters component (header with filter and total)
 */
export interface PaymentFiltersProps {
  filterYear: string;
  onFilterChange: (year: string) => void;
  years: string[];
  totalAmount: number;
}
