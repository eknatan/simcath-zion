-- Add previous_status field to cases table
-- This field stores the previous status before changing to pending_transfer
-- Used to revert back when the last approved payment is deleted

-- Add the column
ALTER TABLE public.cases
ADD COLUMN previous_status VARCHAR(50);

-- Add default value for existing rows
UPDATE public.cases
SET previous_status = 'new'
WHERE previous_status IS NULL AND status != 'pending_transfer';

UPDATE public.cases
SET previous_status = 'new'
WHERE previous_status IS NULL AND status = 'pending_transfer';

-- Make the column NOT NULL after populating existing rows
ALTER TABLE public.cases
ALTER COLUMN previous_status SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.cases.previous_status IS 'Previous status before pending_transfer - used for status reversion when last payment is deleted';