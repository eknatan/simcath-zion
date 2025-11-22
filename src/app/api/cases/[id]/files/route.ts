import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadToStorage, validateFile } from '@/lib/services/file-storage.service';
import { createAuditLogger } from '@/lib/middleware/audit-log.middleware';

/**
 * GET /api/cases/[id]/files
 *
 * Get all files for a case
 */
export async function GET(
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

    // Fetch files
    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('case_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in GET /api/cases/[id]/files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/cases/[id]/files
 *
 * Upload a file to a case
 */
export async function POST(
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

    // Verify case exists and user has access
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('file_type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!fileType) {
      return NextResponse.json({ error: 'File type is required' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload to storage
    const uploadResult = await uploadToStorage(file, {
      filename: file.name,
      contentType: file.type,
      caseId: id,
      fileType: fileType,
    });

    // Save file metadata to database
    const { data: savedFile, error: saveError } = await supabase
      .from('files')
      .insert({
        case_id: id,
        file_type: fileType,
        filename: file.name,
        path_or_url: uploadResult.url,
        size_bytes: file.size,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving file metadata:', saveError);
      // TODO: Clean up uploaded file from storage
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
    }

    // Log to case history using middleware
    const auditLogger = createAuditLogger(supabase);
    await auditLogger.logAction(id, user.id, 'file_uploaded', {
      newValue: fileType,
      note: `file_uploaded|filename:${file.name}`
    });

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/cases/[id]/files:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
