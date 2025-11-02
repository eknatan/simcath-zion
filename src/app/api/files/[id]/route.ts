import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFromStorage } from '@/lib/services/file-storage.service';

/**
 * DELETE /api/files/[id]
 *
 * Delete a file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*, cases!inner(id)')
      .eq('id', id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from storage
    try {
      await deleteFromStorage(file.path_or_url);
    } catch (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting file from database:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }

    // Log to case history
    await supabase.from('case_history').insert({
      case_id: file.case_id,
      changed_by: user.id,
      field_changed: 'file_deleted',
      old_value: file.file_type,
      note: `Deleted ${file.filename}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/files/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
