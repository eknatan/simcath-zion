-- Add rejection tracking fields to cases table
-- Used for wedding case rejection with 30-day restore window

ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comments
COMMENT ON COLUMN public.cases.rejected_at IS 'Timestamp when the case was rejected - used for 30-day restore window';
COMMENT ON COLUMN public.cases.rejected_by IS 'User ID who rejected the case';
COMMENT ON COLUMN public.cases.rejection_reason IS 'Optional reason for rejection';

-- Create index for efficient querying of rejected cases
CREATE INDEX IF NOT EXISTS idx_cases_rejected_at ON public.cases(rejected_at) WHERE rejected_at IS NOT NULL;
