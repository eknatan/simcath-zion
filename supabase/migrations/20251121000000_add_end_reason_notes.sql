-- Add end_reason_notes column to cases table
-- This allows storing additional notes when closing a case

ALTER TABLE cases
ADD COLUMN IF NOT EXISTS end_reason_notes TEXT;

COMMENT ON COLUMN cases.end_reason_notes IS 'Additional notes explaining the reason for closing the case';
