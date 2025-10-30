-- Add missing fields to cases table
-- Migration: Add occupation fields and additional contact fields

-- Add occupation fields for groom and bride parents (wedding cases)
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS groom_father_occupation TEXT,
ADD COLUMN IF NOT EXISTS groom_mother_occupation TEXT,
ADD COLUMN IF NOT EXISTS bride_father_occupation TEXT,
ADD COLUMN IF NOT EXISTS bride_mother_occupation TEXT;

-- Add additional phone fields (mainly for cleaning cases)
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS contact_phone2 TEXT,
ADD COLUMN IF NOT EXISTS contact_phone3 TEXT;

-- Add start_date field for cleaning cases
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN cases.groom_father_occupation IS 'Occupation of groom''s father (wedding cases)';
COMMENT ON COLUMN cases.groom_mother_occupation IS 'Occupation of groom''s mother (wedding cases)';
COMMENT ON COLUMN cases.bride_father_occupation IS 'Occupation of bride''s father (wedding cases)';
COMMENT ON COLUMN cases.bride_mother_occupation IS 'Occupation of bride''s mother (wedding cases)';
COMMENT ON COLUMN cases.contact_phone2 IS 'Secondary contact phone number';
COMMENT ON COLUMN cases.contact_phone3 IS 'Tertiary contact phone number';
COMMENT ON COLUMN cases.start_date IS 'Start date of support (cleaning cases only)';
