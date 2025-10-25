-- Migration: Create system_settings table
-- תאריך: 2025-10-23
-- מטרה: ניהול הגדרות מערכת כולל מיילי מזכירות

-- יצירת טבלת הגדרות
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת הגדרת מיילי מזכירות
INSERT INTO public.system_settings (setting_key, setting_value, description, category)
VALUES
  (
    'secretary_emails',
    '["secretary@example.com"]'::jsonb,
    'רשימת כתובות מייל של המזכירות שיקבלו התראות על בקשות חדשות',
    'email'
  ),
  (
    'email_notifications_enabled',
    'true'::jsonb,
    'האם לשלוח התראות מייל (הפעלה/כיבוי כללי)',
    'email'
  ),
  (
    'organization_name',
    '{"he": "שמחת ציון", "en": "Simchat Zion"}'::jsonb,
    'שם הארגון בעברית ובאנגלית',
    'general'
  ),
  (
    'organization_email',
    '"simcahtziondata@gmail.com"'::jsonb,
    'כתובת מייל ראשית של הארגון',
    'general'
  )
ON CONFLICT (setting_key) DO NOTHING;

-- RLS Policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- מדיניות קריאה: כל המשתמשים המחוברים יכולים לקרוא
CREATE POLICY "Authenticated users can read system settings"
  ON public.system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- מדיניות עדכון: רק מנהלים יכולים לעדכן
CREATE POLICY "Only managers can update system settings"
  ON public.system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- אינדקסים
CREATE INDEX IF NOT EXISTS system_settings_category_idx ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS system_settings_key_idx ON public.system_settings(setting_key);

-- טריגר לעדכון updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

COMMENT ON TABLE public.system_settings IS 'הגדרות מערכת כלליות';
COMMENT ON COLUMN public.system_settings.setting_key IS 'מפתח ייחודי להגדרה';
COMMENT ON COLUMN public.system_settings.setting_value IS 'ערך ההגדרה בפורמט JSON (גמיש)';
COMMENT ON COLUMN public.system_settings.category IS 'קטגוריה: general, email, notifications וכו׳';
