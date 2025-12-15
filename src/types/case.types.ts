import { Tables } from './supabase';

// ========================================
// Base Types from Database
// ========================================

export type Case = Tables<'cases'>;
export type Applicant = Tables<'applicants'>;
export type BankDetails = Tables<'bank_details'>;
export type CaseFile = Tables<'files'>;
export type Payment = Tables<'payments'>;
export type CaseHistory = Tables<'case_history'>;
export type Translation = Tables<'translations'>;

// ========================================
// Enums
// ========================================

/**
 * Case types supported by the system
 */
export enum CaseType {
  WEDDING = 'wedding',
  CLEANING = 'cleaning', // sick children support
}

/**
 * Applicant statuses
 */
export enum ApplicantStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Case statuses for wedding cases
 */
export enum WeddingCaseStatus {
  NEW = 'new',
  PENDING_TRANSFER = 'pending_transfer',
  ACTIVE = 'active', // Had transfers, restored for more activity
  TRANSFERRED = 'transferred',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

/**
 * Case statuses for cleaning (sick children) cases
 */
export enum CleaningCaseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export type CaseStatus = WeddingCaseStatus | CleaningCaseStatus;

/**
 * Payment types
 */
export enum PaymentType {
  WEDDING_TRANSFER = 'wedding_transfer',
  MONTHLY_CLEANING = 'monthly_cleaning',
}

/**
 * Payment statuses
 */
export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  TRANSFERRED = 'transferred',
  REJECTED = 'rejected',
}

/**
 * File types for wedding cases
 */
export enum WeddingFileType {
  MENU = 'menu',
  INVITATION = 'invitation',
  COUPLE_PHOTO = 'couple_photo',
  THANK_YOU = 'thank_you',
  OTHER = 'other',
}

/**
 * Reasons for closing a cleaning case
 */
export enum CleaningEndReason {
  HEALED = 'healed',
  DECEASED = 'deceased',
  SUPPORT_ENDED = 'support_ended',
}

// ========================================
// Composite Types
// ========================================

/**
 * Case with all related data loaded (full relations)
 */
export interface CaseWithRelations extends Case {
  bank_details?: BankDetails | null;
  files?: CaseFile[];
  payments?: Payment[];
  history?: CaseHistory[];
  translations?: Translation[];
}

/**
 * Case with computed fields for table display
 */
export interface CaseForTable extends Case {
  has_bank_details: boolean;
  approved_amount: number | null;
  files_count: number;
  required_files_count: number;
}

/**
 * File metadata with additional display info
 */
export interface CaseFileWithMetadata extends CaseFile {
  isRequired: boolean;
  displayName: string;
  thumbnailUrl?: string;
}

/**
 * Payment with user info
 */
export interface PaymentWithUser extends Payment {
  approved_by_name?: string;
}

/**
 * History entry with user info
 */
export interface CaseHistoryWithUser extends CaseHistory {
  changed_by_name?: string;
}

// ========================================
// Form Data Types
// ========================================

/**
 * Wedding-specific form data
 */
export interface WeddingFormData {
  // Wedding info - Structured Hebrew date (new)
  hebrew_day?: number | null;
  hebrew_month?: number | null;
  hebrew_year?: number | null;
  // Legacy field (for backward compatibility)
  wedding_date_hebrew?: string;
  wedding_date_gregorian?: string;
  city?: string;
  venue?: string;
  guests_count?: number;
  total_cost?: number;
  request_background?: string;

  // Groom info
  groom_first_name?: string;
  groom_last_name?: string;
  groom_id?: string;
  groom_school?: string;
  groom_father_name?: string;
  groom_mother_name?: string;
  groom_memorial_day?: string;

  // Bride info
  bride_first_name?: string;
  bride_last_name?: string;
  bride_id?: string;
  bride_school?: string;
  bride_father_name?: string;
  bride_mother_name?: string;
  bride_memorial_day?: string;

  // Contact
  address?: string;
  contact_phone?: string;
  contact_email?: string;
}

/**
 * Cleaning (sick children) form data
 */
export interface CleaningFormData {
  family_name?: string;
  child_name?: string;

  parent1_name?: string;
  parent1_id?: string;

  parent2_name?: string;
  parent2_id?: string;

  address?: string;
  city?: string;

  contact_phone?: string;
  contact_phone2?: string;
  contact_phone3?: string;
  contact_email?: string;

  start_date?: string;
}

/**
 * Bank details form data
 */
export interface BankDetailsFormData {
  bank_number: string;
  branch: string;
  account_number: string;
  account_holder_name: string;
}

// ========================================
// Action Types
// ========================================

/**
 * Payment approval data
 */
export interface PaymentApprovalData {
  amount_usd?: number;
  amount_ils: number;
  exchange_rate?: number;
  notes?: string;
}

/**
 * Monthly payment data for cleaning cases
 */
export interface MonthlyPaymentData {
  payment_month: string; // Format: "YYYY-MM"
  amount_ils: number; // Max 720
  notes?: string;
}

/**
 * Case closure data for cleaning cases
 */
export interface CaseClosureData {
  end_reason: CleaningEndReason;
  end_date: string;
  notes?: string;
}

/**
 * Translation request data
 */
export interface TranslationRequestData {
  case_id: string;
  lang_from: string;
  lang_to: string;
}

/**
 * Translated content structure returned by AI
 */
export interface TranslatedContent {
  wedding_info?: {
    wedding_date_hebrew?: string;
    wedding_date_gregorian?: string;
    city?: string;
    venue?: string;
    guests_count?: number;
    total_cost?: number;
    request_background?: string;
  };
  groom_info?: {
    first_name?: string;
    last_name?: string;
    id_number?: string;
    school?: string;
    father_name?: string;
    mother_name?: string;
    memorial_day?: string;
  };
  bride_info?: {
    first_name?: string;
    last_name?: string;
    id_number?: string;
    school?: string;
    father_name?: string;
    mother_name?: string;
    memorial_day?: string;
  };
  contact_info?: {
    address?: string;
    phone?: string;
    email?: string;
  };
  family_info?: {
    family_name?: string;
    child_name?: string;
    parent1_name?: string;
    parent1_id?: string;
    parent2_name?: string;
    parent2_id?: string;
    address?: string;
    city?: string;
    phone?: string;
    phone2?: string;
    phone3?: string;
    email?: string;
    start_date?: string;
  };
}

// ========================================
// UI Display Types
// ========================================

/**
 * Tab indicator status
 */
export enum TabStatus {
  COMPLETE = 'complete',
  WARNING = 'warning',
  ERROR = 'error',
  NONE = 'none',
}

/**
 * Tab metadata for UI
 */
export interface TabMetadata {
  id: string;
  label: string;
  icon: string;
  status: TabStatus;
  count?: string; // e.g., "3/4" for files
}

/**
 * Bank info for display
 */
export interface BankInfo {
  code: string;
  name: string;
}

/**
 * Required files checklist
 */
export interface RequiredFilesStatus {
  total: number;
  uploaded: number;
  missing: WeddingFileType[];
}

// ========================================
// Utility Types
// ========================================

/**
 * Case list item (minimal data for tables)
 */
export type CaseListItem = Pick<
  Case,
  | 'id'
  | 'case_number'
  | 'case_type'
  | 'status'
  | 'groom_first_name'
  | 'groom_last_name'
  | 'bride_first_name'
  | 'bride_last_name'
  | 'family_name'
  | 'wedding_date_gregorian'
  | 'city'
  | 'created_at'
>;

/**
 * Case update payload
 */
export type CaseUpdatePayload = Partial<
  Omit<Case, 'id' | 'created_at' | 'updated_at' | 'case_number'>
>;

// ========================================
// Constants
// ========================================

/**
 * Israeli banks list
 */
export const ISRAELI_BANKS: BankInfo[] = [
  { code: '10', name: 'בנק לאומי' },
  { code: '11', name: 'בנק דיסקונט' },
  { code: '12', name: 'בנק הפועלים' },
  { code: '13', name: 'בנק איגוד' },
  { code: '14', name: 'בנק אוצר החייל' },
  { code: '17', name: 'בנק מרכנתיל' },
  { code: '20', name: 'בנק מזרחי טפחות' },
  { code: '31', name: 'בנק הבינלאומי' },
  { code: '46', name: 'בנק מסד' },
  { code: '52', name: 'בנק פועלי אגודת ישראל' },
];

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed file extensions for uploads
 */
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * Default maximum monthly payment for cleaning cases (in ILS)
 * Note: This is a fallback value. The actual cap is stored in system_settings
 * and should be fetched using useMonthlyCapSetting hook or getMonthlyCapFromSettings()
 */
export const DEFAULT_MONTHLY_CLEANING_PAYMENT = 720;

/**
 * Required files for wedding cases
 */
export const REQUIRED_WEDDING_FILES: WeddingFileType[] = [
  WeddingFileType.MENU,
  WeddingFileType.INVITATION,
  WeddingFileType.COUPLE_PHOTO,
];
