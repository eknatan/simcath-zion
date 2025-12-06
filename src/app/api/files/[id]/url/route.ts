import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedUrl } from '@/lib/services/file-storage.service';

/**
 * GET /api/files/[id]/url
 *
 * Get a signed URL for a file (valid for 1 hour)
 * Requires authentication - only logged-in users can access files
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

    // Get file metadata
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('id, path_or_url, filename')
      .eq('id', id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Generate signed URL
    const signedUrl = await getSignedUrl(file.path_or_url);

    return NextResponse.json({
      url: signedUrl,
      filename: file.filename
    });
  } catch (error) {
    console.error('Error in GET /api/files/[id]/url:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
