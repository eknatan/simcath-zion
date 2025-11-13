-- =====================================================
-- טבלת העברות ידניות (Manual Transfers)
-- תאריך: 2024-11-12
-- =====================================================

CREATE TABLE public.manual_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- פרטי מקבל
  recipient_name VARCHAR(255) NOT NULL,
  id_number VARCHAR(20), -- אופציונלי

  -- פרטי חשבון בנק
  bank_code VARCHAR(10) NOT NULL,
  branch_code VARCHAR(10) NOT NULL,
  account_number VARCHAR(20) NOT NULL,

  -- סכום
  amount NUMERIC(10, 2) NOT NULL,

  -- סטטוס
  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  -- מטאדטה
  imported_from_file VARCHAR(255), -- שם קובץ האקסל המקורי
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- אילוצים
  CONSTRAINT amount_positive_check CHECK (amount > 0),
  CONSTRAINT status_check CHECK (status IN ('pending', 'selected', 'exported'))
);

-- RLS Policies
ALTER TABLE public.manual_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all manual transfers"
  ON public.manual_transfers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert manual transfers"
  ON public.manual_transfers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update manual transfers"
  ON public.manual_transfers FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete manual transfers"
  ON public.manual_transfers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX manual_transfers_status_idx ON public.manual_transfers(status);
CREATE INDEX manual_transfers_created_at_idx ON public.manual_transfers(created_at DESC);
CREATE INDEX manual_transfers_created_by_idx ON public.manual_transfers(created_by);

-- Trigger לעדכון updated_at
CREATE TRIGGER update_manual_transfers_updated_at
  BEFORE UPDATE ON public.manual_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- טבלת יצוא מס"ב להעברות ידניות
-- =====================================================

CREATE TABLE public.manual_transfers_export (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filename VARCHAR(255),
  file_url TEXT,
  transfers_included JSONB NOT NULL, -- מערך של IDs של ההעברות שנכללו
  total_amount NUMERIC(10, 2) NOT NULL,
  total_count INTEGER NOT NULL,

  CONSTRAINT total_count_check CHECK (total_count > 0)
);

-- RLS Policies
ALTER TABLE public.manual_transfers_export ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all manual exports"
  ON public.manual_transfers_export FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert manual exports"
  ON public.manual_transfers_export FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX manual_transfers_export_exported_at_idx ON public.manual_transfers_export(exported_at DESC);
CREATE INDEX manual_transfers_export_exported_by_idx ON public.manual_transfers_export(exported_by);

-- =====================================================
-- End of migration
-- =====================================================
