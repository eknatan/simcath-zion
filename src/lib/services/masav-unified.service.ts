/**
 * Unified MASAV Service
 *
 * This service provides a single interface for generating MASAV files
 * from both regular transfers (linked to cases) and manual transfers.
 *
 * Uses the adapter pattern to normalize both types into a common format.
 */

import { MasavFileGenerator, type MasavFileOptions, type MasavFileResult } from './masav-file-generator.service';
import { MasavOrganizationSettings } from './settings.service';
import type { TransferWithDetails } from '@/types/transfers.types';
import type { ManualTransfer } from '@/types/manual-transfers.types';

// ========================================
// Unified Interface
// ========================================

/**
 * Normalized transfer data for MASAV generation
 * This is what the MASAV generator actually needs
 */
export interface MasavTransferData {
  // Bank details
  bank_number: string;
  branch: string;
  account_number: string;
  account_holder_name: string;

  // Amount
  amount_ils: number;

  // Reference (for MASAV record)
  reference: string;

  // Optional ID number
  id_number?: string;
}

// ========================================
// Adapter Functions
// ========================================

/**
 * Convert regular transfer to MASAV format
 */
function adaptRegularTransfer(transfer: TransferWithDetails): MasavTransferData {
  if (!transfer.bank_details) {
    throw new Error(`Transfer ${transfer.id} is missing bank details`);
  }

  return {
    bank_number: transfer.bank_details.bank_number,
    branch: transfer.bank_details.branch,
    account_number: transfer.bank_details.account_number,
    account_holder_name: transfer.bank_details.account_holder_name,
    amount_ils: transfer.amount_ils,
    reference: transfer.case.case_number.toString(),
    // Regular transfers don't have ID number in our system
    id_number: undefined,
  };
}

/**
 * Convert manual transfer to MASAV format
 */
function adaptManualTransfer(transfer: ManualTransfer, index: number): MasavTransferData {
  return {
    bank_number: transfer.bank_code,
    branch: transfer.branch_code,
    account_number: transfer.account_number,
    account_holder_name: transfer.recipient_name,
    amount_ils: transfer.amount,
    // Use transfer ID or index as reference for manual transfers
    reference: `MT${(index + 1).toString().padStart(6, '0')}`, // MT000001, MT000002, etc.
    id_number: transfer.id_number || undefined,
  };
}

// ========================================
// Validation
// ========================================

/**
 * Validate transfer data before MASAV generation
 */
function validateTransferData(transfer: MasavTransferData, index: number): void {
  const errors: string[] = [];

  // Validate bank details (allowing 1-3 digits for bank, 1-3 for branch)
  if (!/^\d{1,3}$/.test(transfer.bank_number)) {
    errors.push('Invalid bank code (must be 1-3 digits)');
  }
  if (!/^\d{1,3}$/.test(transfer.branch)) {
    errors.push('Invalid branch code (must be 1-3 digits)');
  }
  if (!/^\d{2,20}$/.test(transfer.account_number)) {
    errors.push('Invalid account number (must be 2-20 digits)');
  }
  if (!transfer.account_holder_name || transfer.account_holder_name.length === 0) {
    errors.push('Missing account holder name');
  }

  // Validate amount
  if (!transfer.amount_ils || transfer.amount_ils <= 0) {
    errors.push('Invalid amount (must be positive)');
  }
  if (transfer.amount_ils > 9999999999.99) {
    errors.push('Amount too large for MASAV format');
  }

  // Validate reference
  if (!transfer.reference) {
    errors.push('Missing reference');
  }

  if (errors.length > 0) {
    throw new Error(
      `Transfer #${index + 1} validation failed: ${errors.join(', ')}`
    );
  }
}

// ========================================
// Extended Generator with Unified Interface
// ========================================

/**
 * Extended MASAV File Generator that works with normalized data
 */
export class UnifiedMasavFileGenerator extends MasavFileGenerator {
  /**
   * Generate MASAV file from normalized transfer data
   */
  public generateFromNormalizedData(transfers: MasavTransferData[]): MasavFileResult {
    if (transfers.length === 0) {
      throw new Error('No transfers provided');
    }

    // Validate all transfers
    transfers.forEach((transfer, index) => validateTransferData(transfer, index));

    // Convert to TransferWithDetails format for the parent class
    // This is a bit of a hack, but it allows us to reuse the existing generator
    const adaptedTransfers = transfers.map((transfer) => ({
      id: '',
      case_id: '',
      payment_type: 'wedding_transfer' as const,
      payment_month: null,
      amount_ils: transfer.amount_ils,
      amount_usd: null,
      exchange_rate: null,
      status: 'approved' as const,
      approved_amount: null,
      approved_by: null,
      transferred_at: null,
      receipt_reference: null,
      notes: null,
      created_at: null,
      updated_at: null,
      case: {
        id: '',
        case_number: parseInt(transfer.reference.replace(/\D/g, '')) || 0,
        case_type: 'wedding' as const,
        applicant_id: null,
        created_by: null,
        status: 'new' as const,
        wedding_date_hebrew: null,
        wedding_date_gregorian: null,
        groom_first_name: null,
        groom_last_name: null,
        groom_id: null,
        groom_father_name: null,
        groom_father_occupation: null,
        groom_mother_name: null,
        groom_mother_occupation: null,
        groom_school: null,
        groom_memorial_day: null,
        groom_background: null,
        bride_first_name: null,
        bride_last_name: null,
        bride_id: null,
        bride_father_name: null,
        bride_father_occupation: null,
        bride_mother_name: null,
        bride_mother_occupation: null,
        bride_school: null,
        bride_memorial_day: null,
        bride_background: null,
        venue: null,
        guests_count: null,
        total_cost: null,
        family_name: null,
        child_name: null,
        parent1_id: null,
        parent1_name: null,
        parent2_id: null,
        parent2_name: null,
        start_date: null,
        end_date: null,
        end_reason: null,
        address: null,
        city: null,
        contact_phone: null,
        contact_phone2: null,
        contact_phone3: null,
        contact_email: null,
        raw_form_json: null,
        created_at: null,
        updated_at: null,
      },
      bank_details: {
        id: '',
        case_id: '',
        bank_number: transfer.bank_number,
        branch: transfer.branch,
        account_number: transfer.account_number,
        account_holder_name: transfer.account_holder_name,
        created_at: null,
        updated_at: null,
      },
    })) as unknown as TransferWithDetails[];

    return this.generate(adaptedTransfers);
  }
}

// ========================================
// Main Service
// ========================================

export class UnifiedMasavService {
  /**
   * Generate MASAV file from regular transfers
   */
  static async generateFromRegularTransfers(
    settings: MasavOrganizationSettings,
    transfers: TransferWithDetails[],
    options: MasavFileOptions
  ): Promise<MasavFileResult> {
    const normalizedTransfers = transfers.map(adaptRegularTransfer);
    const generator = new UnifiedMasavFileGenerator(settings, options);
    return generator.generateFromNormalizedData(normalizedTransfers);
  }

  /**
   * Generate MASAV file from manual transfers
   */
  static async generateFromManualTransfers(
    settings: MasavOrganizationSettings,
    transfers: ManualTransfer[],
    options: MasavFileOptions
  ): Promise<MasavFileResult> {
    const normalizedTransfers = transfers.map((transfer, index) =>
      adaptManualTransfer(transfer, index)
    );
    const generator = new UnifiedMasavFileGenerator(settings, options);
    return generator.generateFromNormalizedData(normalizedTransfers);
  }

  /**
   * Generate MASAV file from mixed transfers (both types)
   */
  static async generateFromMixedTransfers(
    settings: MasavOrganizationSettings,
    regularTransfers: TransferWithDetails[],
    manualTransfers: ManualTransfer[],
    options: MasavFileOptions
  ): Promise<MasavFileResult> {
    const normalizedRegular = regularTransfers.map(adaptRegularTransfer);
    const normalizedManual = manualTransfers.map((transfer, index) =>
      adaptManualTransfer(transfer, index + regularTransfers.length)
    );

    const allTransfers = [...normalizedRegular, ...normalizedManual];
    const generator = new UnifiedMasavFileGenerator(settings, options);
    return generator.generateFromNormalizedData(allTransfers);
  }
}
