-- =====================================================
-- מערכת תמיכה למשפחות - Supabase Schema
-- תאריך: אוקטובר 2025
-- גרסה: 1.0
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Table: profiles (מורחב מ-auth.users של Supabase)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'secretary',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT role_check CHECK (role IN ('secretary', 'manager'))
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Index
CREATE INDEX profiles_role_idx ON public.profiles(role);

-- =====================================================
-- Table: applicants (טפסים גולמיים)
-- =====================================================
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type VARCHAR(50) NOT NULL,
  form_data JSONB NOT NULL,
  email_sent_to_secretary BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT case_type_check CHECK (case_type IN ('wedding', 'cleaning')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- RLS Policies for applicants
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all applicants"
  ON public.applicants FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert applicants"
  ON public.applicants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update applicants"
  ON public.applicants FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX applicants_case_type_idx ON public.applicants(case_type);
CREATE INDEX applicants_status_idx ON public.applicants(status);
CREATE INDEX applicants_created_at_idx ON public.applicants(created_at DESC);

-- =====================================================
-- Table: cases (תיקים)
-- =====================================================
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number BIGSERIAL UNIQUE NOT NULL,
  case_type VARCHAR(50) NOT NULL,
  applicant_id UUID REFERENCES public.applicants(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,

  -- Wedding fields
  wedding_date_hebrew VARCHAR(100),
  wedding_date_gregorian DATE,
  groom_first_name VARCHAR(100),
  groom_last_name VARCHAR(100),
  groom_id VARCHAR(20),
  groom_father_name VARCHAR(100),
  groom_mother_name VARCHAR(100),
  groom_school VARCHAR(255),
  groom_memorial_day VARCHAR(100),
  groom_background TEXT,
  bride_first_name VARCHAR(100),
  bride_last_name VARCHAR(100),
  bride_id VARCHAR(20),
  bride_father_name VARCHAR(100),
  bride_mother_name VARCHAR(100),
  bride_school VARCHAR(255),
  bride_memorial_day VARCHAR(100),
  bride_background TEXT,
  venue VARCHAR(255),
  guests_count INTEGER,
  total_cost NUMERIC(10, 2),

  -- Cleaning fields
  family_name VARCHAR(100),
  child_name VARCHAR(100),
  parent1_id VARCHAR(20),
  parent1_name VARCHAR(100),
  parent2_id VARCHAR(20),
  parent2_name VARCHAR(100),
  start_date DATE,
  end_date DATE,
  end_reason VARCHAR(100),

  -- Common fields
  address TEXT,
  city VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_phone2 VARCHAR(20),
  contact_phone3 VARCHAR(20),
  contact_email VARCHAR(255),
  raw_form_json JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT case_type_check CHECK (case_type IN ('wedding', 'cleaning')),
  CONSTRAINT wedding_status_check CHECK (
    case_type != 'wedding' OR
    status IN ('new', 'pending_transfer', 'transferred', 'rejected', 'expired')
  ),
  CONSTRAINT cleaning_status_check CHECK (
    case_type != 'cleaning' OR
    status IN ('active', 'inactive')
  ),
  CONSTRAINT end_reason_check CHECK (
    end_reason IS NULL OR
    end_reason IN ('healed', 'deceased', 'other')
  )
);

-- RLS Policies for cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all cases"
  ON public.cases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cases"
  ON public.cases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update cases"
  ON public.cases FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete cases"
  ON public.cases FOR DELETE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX cases_case_type_idx ON public.cases(case_type);
CREATE INDEX cases_status_idx ON public.cases(status);
CREATE INDEX cases_wedding_date_idx ON public.cases(wedding_date_gregorian) WHERE case_type = 'wedding';
CREATE INDEX cases_family_name_idx ON public.cases(family_name) WHERE case_type = 'cleaning';
CREATE INDEX cases_created_at_idx ON public.cases(created_at DESC);
CREATE INDEX cases_case_number_idx ON public.cases(case_number);

-- =====================================================
-- Table: translations (תרגומים)
-- =====================================================
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  lang_from VARCHAR(5) DEFAULT 'he',
  lang_to VARCHAR(5) NOT NULL,
  content_json JSONB NOT NULL,
  edited_by_user BOOLEAN DEFAULT FALSE,
  translated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT lang_check CHECK (lang_from IN ('he', 'en') AND lang_to IN ('he', 'en')),
  CONSTRAINT unique_case_lang UNIQUE (case_id, lang_to)
);

-- RLS Policies for translations
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all translations"
  ON public.translations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert translations"
  ON public.translations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update translations"
  ON public.translations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX translations_case_id_idx ON public.translations(case_id);
CREATE INDEX translations_lang_to_idx ON public.translations(lang_to);

-- =====================================================
-- Table: files (קבצים)
-- =====================================================
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  path_or_url TEXT NOT NULL,
  size_bytes INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT file_type_check CHECK (file_type IN ('menu', 'invitation', 'photo', 'thank_you', 'other'))
);

-- RLS Policies for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all files"
  ON public.files FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert files"
  ON public.files FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete files"
  ON public.files FOR DELETE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX files_case_id_idx ON public.files(case_id);
CREATE INDEX files_file_type_idx ON public.files(file_type);

-- =====================================================
-- Table: bank_details (פרטי בנק)
-- =====================================================
CREATE TABLE public.bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  bank_number VARCHAR(10) NOT NULL,
  branch VARCHAR(10) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_case_bank UNIQUE (case_id)
);

-- RLS Policies for bank_details
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all bank details"
  ON public.bank_details FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert bank details"
  ON public.bank_details FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update bank details"
  ON public.bank_details FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Index
CREATE INDEX bank_details_case_id_idx ON public.bank_details(case_id);

-- =====================================================
-- Table: payments (תשלומים)
-- =====================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  payment_type VARCHAR(50) NOT NULL,
  payment_month DATE,

  amount_usd NUMERIC(10, 2),
  amount_ils NUMERIC(10, 2) NOT NULL,
  exchange_rate NUMERIC(10, 4),

  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approved_amount NUMERIC(10, 2),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  transferred_at TIMESTAMP WITH TIME ZONE,
  receipt_reference VARCHAR(255),

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT payment_type_check CHECK (payment_type IN ('wedding_transfer', 'cleaning_monthly')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'transferred', 'rejected')),
  CONSTRAINT amount_check CHECK (amount_ils > 0)
);

-- RLS Policies for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all payments"
  ON public.payments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payments"
  ON public.payments FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX payments_case_id_idx ON public.payments(case_id);
CREATE INDEX payments_status_idx ON public.payments(status);
CREATE INDEX payments_payment_month_idx ON public.payments(payment_month);
CREATE INDEX payments_transferred_at_idx ON public.payments(transferred_at);

-- =====================================================
-- Table: transfers_export (יצוא MASAV)
-- =====================================================
CREATE TABLE public.transfers_export (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL,
  exported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filename VARCHAR(255),
  file_url TEXT,
  cases_included JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  total_count INTEGER NOT NULL,

  CONSTRAINT export_type_check CHECK (export_type IN ('wedding', 'cleaning', 'mixed')),
  CONSTRAINT total_count_check CHECK (total_count > 0)
);

-- RLS Policies for transfers_export
ALTER TABLE public.transfers_export ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all exports"
  ON public.transfers_export FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exports"
  ON public.transfers_export FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX transfers_export_type_idx ON public.transfers_export(export_type);
CREATE INDEX transfers_exported_at_idx ON public.transfers_export(exported_at DESC);

-- =====================================================
-- Table: case_history (audit log)
-- =====================================================
CREATE TABLE public.case_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for case_history
ALTER TABLE public.case_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all history"
  ON public.case_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert history"
  ON public.case_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX case_history_case_id_idx ON public.case_history(case_id);
CREATE INDEX case_history_changed_at_idx ON public.case_history(changed_at DESC);

-- =====================================================
-- Table: email_logs (לוג מיילים)
-- =====================================================
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,

  CONSTRAINT email_type_check CHECK (email_type IN ('monthly_request', 'approval', 'transfer_summary', 'notification', 'other')),
  CONSTRAINT status_check CHECK (status IN ('sent', 'failed', 'bounced', 'pending'))
);

-- RLS Policies for email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all email logs"
  ON public.email_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX email_logs_case_id_idx ON public.email_logs(case_id);
CREATE INDEX email_logs_email_type_idx ON public.email_logs(email_type);
CREATE INDEX email_logs_sent_at_idx ON public.email_logs(sent_at DESC);
CREATE INDEX email_logs_status_idx ON public.email_logs(status);

-- =====================================================
-- Functions: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON public.applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_details_updated_at BEFORE UPDATE ON public.bank_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Function: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'secretary');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- End of migration
-- =====================================================
