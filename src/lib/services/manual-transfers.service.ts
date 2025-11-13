import { createClient } from '@/lib/supabase/client';
import { ManualTransferStatus } from '@/types/manual-transfers.types';
import type {
  ManualTransfer,
  ManualTransferFilters,
  ManualTransferSort,
  ManualTransferSummary,
} from '@/types/manual-transfers.types';
import {
  manualTransferCreateSchema,
  manualTransferUpdateSchema,
  type ManualTransferCreateInput,
  type ManualTransferUpdateInput,
} from '@/lib/validation/manual-transfer.schema';

/**
 * Service for managing manual transfers
 */
export class ManualTransfersService {
  private supabase = createClient();

  /**
   * Get all manual transfers with optional filters
   */
  async getAll(filters?: ManualTransferFilters, sort?: ManualTransferSort): Promise<{
    data: ManualTransfer[] | null;
    error: Error | null;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = this.supabase
        .from('manual_transfers' as any)
        .select('*');

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.amount_min) {
        query = query.gte('amount', filters.amount_min);
      }

      if (filters?.amount_max) {
        query = query.lte('amount', filters.amount_max);
      }

      if (filters?.search) {
        query = query.ilike('recipient_name', `%${filters.search}%`);
      }

      if (filters?.imported_from_file) {
        query = query.eq('imported_from_file', filters.imported_from_file);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as unknown as ManualTransfer[], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Get single manual transfer by ID
   */
  async getById(id: string): Promise<{
    data: ManualTransfer | null;
    error: Error | null;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await this.supabase
        .from('manual_transfers' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as unknown as ManualTransfer, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  /**
   * Create a new manual transfer
   */
  async create(input: ManualTransferCreateInput, userId?: string, filename?: string): Promise<{
    data: ManualTransfer | null;
    error: Error | null;
  }> {
    try {
      // Validate input
      const validated = manualTransferCreateSchema.parse(input);

      const insertData = {
        recipient_name: validated.recipient_name,
        id_number: validated.id_number || null,
        bank_code: validated.bank_code,
        branch_code: validated.branch_code,
        account_number: validated.account_number,
        amount: validated.amount,
        status: 'pending' as ManualTransferStatus,
        created_by: userId || null,
        imported_from_file: filename || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await this.supabase
        .from('manual_transfers' as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as unknown as ManualTransfer, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Validation failed'),
      };
    }
  }

  /**
   * Bulk create manual transfers (for Excel import)
   */
  async bulkCreate(
    inputs: ManualTransferCreateInput[],
    userId?: string,
    filename?: string
  ): Promise<{
    data: ManualTransfer[] | null;
    error: Error | null;
    successCount: number;
    errors: Array<{ index: number; error: string }>;
  }> {
    try {
      const errors: Array<{ index: number; error: string }> = [];

      const insertData = inputs.map((input, index) => {
        try {
          console.log(`Validating row ${index}:`, input);
          const validated = manualTransferCreateSchema.parse(input);
          console.log(`Row ${index} validated successfully:`, validated);
          return {
            recipient_name: validated.recipient_name,
            id_number: validated.id_number || null,
            bank_code: validated.bank_code,
            branch_code: validated.branch_code,
            account_number: validated.account_number,
            amount: validated.amount,
            status: 'pending' as ManualTransferStatus,
            created_by: userId || null,
            imported_from_file: filename || null,
          };
        } catch (error) {
          console.error(`Row ${index} validation failed:`, error);
          errors.push({ index, error: error instanceof Error ? error.message : 'Validation failed' });
          return null;
        }
      });

      // Filter out null values
      const validData = insertData.filter((item): item is NonNullable<typeof item> => item !== null);

      if (validData.length === 0) {
        return {
          data: null,
          error: new Error('No valid transfers to insert'),
          successCount: 0,
          errors: [{ index: 0, error: 'All transfers failed validation' }],
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await this.supabase
        .from('manual_transfers' as any)
        .insert(validData)
        .select();

      if (error) {
        return {
          data: null,
          error: new Error(error.message),
          successCount: 0,
          errors: [{ index: 0, error: error.message }],
        };
      }

      return {
        data: data as unknown as ManualTransfer[],
        error: null,
        successCount: data.length,
        errors,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Bulk insert failed'),
        successCount: 0,
        errors: [{ index: 0, error: 'Unknown error' }],
      };
    }
  }

  /**
   * Update a manual transfer
   */
  async update(id: string, input: ManualTransferUpdateInput): Promise<{
    data: ManualTransfer | null;
    error: Error | null;
  }> {
    try {
      // Validate input
      const validated = manualTransferUpdateSchema.parse(input);

      const updateData: Record<string, unknown> = {};
      if (validated.recipient_name !== undefined) updateData.recipient_name = validated.recipient_name;
      if (validated.id_number !== undefined) updateData.id_number = validated.id_number;
      if (validated.bank_code !== undefined) updateData.bank_code = validated.bank_code;
      if (validated.branch_code !== undefined) updateData.branch_code = validated.branch_code;
      if (validated.account_number !== undefined) updateData.account_number = validated.account_number;
      if (validated.amount !== undefined) updateData.amount = validated.amount;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await this.supabase
        .from('manual_transfers' as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as unknown as ManualTransfer, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Update failed'),
      };
    }
  }

  /**
   * Update status for multiple transfers
   */
  async updateStatus(ids: string[], status: ManualTransferStatus): Promise<{
    data: ManualTransfer[] | null;
    error: Error | null;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await this.supabase
        .from('manual_transfers' as any)
        .update({ status })
        .in('id', ids)
        .select();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as unknown as ManualTransfer[], error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Status update failed'),
      };
    }
  }

  /**
   * Delete a manual transfer
   */
  async delete(id: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await this.supabase
        .from('manual_transfers' as any)
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Delete failed'),
      };
    }
  }

  /**
   * Bulk delete manual transfers
   */
  async bulkDelete(ids: string[]): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await this.supabase
        .from('manual_transfers' as any)
        .delete()
        .in('id', ids);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Bulk delete failed'),
      };
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(): Promise<{
    data: ManualTransferSummary | null;
    error: Error | null;
  }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allTransfers, error } = await this.supabase
        .from('manual_transfers' as any)
        .select('amount, status, imported_from_file, created_at');

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      if (!allTransfers) {
        return { data: null, error: new Error('No data found') };
      }

      const transfers = allTransfers as unknown as ManualTransfer[];

      const summary: ManualTransferSummary = {
        total_count: transfers.length,
        total_amount: transfers.reduce((sum, t) => sum + Number(t.amount), 0),
        by_status: {
          [ManualTransferStatus.PENDING]: { count: 0, amount: 0 },
          [ManualTransferStatus.SELECTED]: { count: 0, amount: 0 },
          [ManualTransferStatus.EXPORTED]: { count: 0, amount: 0 },
        },
        recent_imports: [],
      };

      // Calculate by status
      transfers.forEach((t) => {
        const status = t.status as ManualTransferStatus;
        summary.by_status[status].count++;
        summary.by_status[status].amount += Number(t.amount);
      });

      // Get recent imports
      const importsMap = new Map<string, { count: number; date: string }>();
      transfers.forEach((t) => {
        if (t.imported_from_file) {
          const existing = importsMap.get(t.imported_from_file);
          if (existing) {
            existing.count++;
          } else {
            importsMap.set(t.imported_from_file, {
              count: 1,
              date: t.created_at || '',
            });
          }
        }
      });

      summary.recent_imports = Array.from(importsMap.entries())
        .map(([filename, data]) => ({
          filename,
          count: data.count,
          date: data.date,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return { data: summary, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to get summary'),
      };
    }
  }
}

// Export singleton instance
export const manualTransfersService = new ManualTransfersService();
