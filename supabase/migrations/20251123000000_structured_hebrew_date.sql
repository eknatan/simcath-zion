-- Migration: Convert wedding_date_hebrew from text to structured fields
-- This improves data integrity and eliminates parsing errors

-- Step 1: Add new structured fields
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS hebrew_day INTEGER,
ADD COLUMN IF NOT EXISTS hebrew_month INTEGER,
ADD COLUMN IF NOT EXISTS hebrew_year INTEGER;

-- Step 2: Add constraints for valid ranges
ALTER TABLE public.cases
ADD CONSTRAINT check_hebrew_day CHECK (hebrew_day IS NULL OR (hebrew_day >= 1 AND hebrew_day <= 30)),
ADD CONSTRAINT check_hebrew_month CHECK (hebrew_month IS NULL OR (hebrew_month >= 1 AND hebrew_month <= 13)),
ADD CONSTRAINT check_hebrew_year CHECK (hebrew_year IS NULL OR (hebrew_year >= 5700 AND hebrew_year <= 6000));

-- Step 3: Create index for calendar queries (filter by month/year)
CREATE INDEX IF NOT EXISTS idx_cases_hebrew_date
ON public.cases (hebrew_year, hebrew_month, hebrew_day)
WHERE hebrew_year IS NOT NULL;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN public.cases.hebrew_day IS 'Day of Hebrew month (1-30)';
COMMENT ON COLUMN public.cases.hebrew_month IS 'Hebrew month number: 1=Nisan, 2=Iyyar, 3=Sivan, 4=Tamuz, 5=Av, 6=Elul, 7=Tishrei, 8=Cheshvan, 9=Kislev, 10=Tevet, 11=Shvat, 12=Adar I, 13=Adar II';
COMMENT ON COLUMN public.cases.hebrew_year IS 'Hebrew year (e.g., 5785)';

-- Note: Data migration from wedding_date_hebrew will be done via application code
-- The old wedding_date_hebrew field will be kept temporarily for backward compatibility
-- and removed in a future migration after data is migrated
