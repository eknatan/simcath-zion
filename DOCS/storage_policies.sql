-- ================================================
-- Supabase Storage Policies for case-files bucket
-- ================================================
--
-- Run this SQL in Supabase Dashboard:
-- 1. Go to SQL Editor (left sidebar)
-- 2. Click "New query"
-- 3. Paste this entire file
-- 4. Click "Run"
--
-- ================================================

-- 1. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 2. Allow authenticated users to read/download files
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-files' AND
  auth.role() = 'authenticated'
);

-- 4. Allow public access to files (for previews and downloads)
-- This allows anyone with the URL to view the file
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'case-files');

-- ================================================
-- Verify policies were created successfully
-- ================================================
-- Run this to check:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
