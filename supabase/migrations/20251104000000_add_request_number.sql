-- Add request_number field to applicants table
-- מספר בקשה רץ מ-100

-- Add the column
ALTER TABLE public.applicants
ADD COLUMN request_number INTEGER UNIQUE;

-- Create a sequence starting from 100
CREATE SEQUENCE IF NOT EXISTS applicants_request_number_seq
START WITH 100
INCREMENT BY 1;

-- Set default value for new rows
ALTER TABLE public.applicants
ALTER COLUMN request_number SET DEFAULT nextval('applicants_request_number_seq');

-- Update existing rows with sequential numbers starting from 100
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) + 99 as new_request_number
  FROM public.applicants
  WHERE request_number IS NULL
)
UPDATE public.applicants
SET request_number = numbered_rows.new_request_number
FROM numbered_rows
WHERE public.applicants.id = numbered_rows.id;

-- Update the sequence to continue from the last assigned number
SELECT setval('applicants_request_number_seq', COALESCE((SELECT MAX(request_number) FROM public.applicants), 99) + 1, false);

-- Make the column NOT NULL after populating existing rows
ALTER TABLE public.applicants
ALTER COLUMN request_number SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.applicants.request_number IS 'מספר בקשה רץ (מתחיל מ-100)';
