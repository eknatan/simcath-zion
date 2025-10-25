-- Migration: Add metadata fields to email_logs table
-- תאריך: 2025-10-23
-- מטרה: הוספת שדות נוספים לרישום מפורט יותר של מיילים

-- הוספת עמודות נוספות (אופציונלי - רק אם רוצים מעקב מפורט יותר)

-- הוספת message_id (מזהה ייחודי מה-mail server)
ALTER TABLE public.email_logs
ADD COLUMN IF NOT EXISTS message_id VARCHAR(255);

-- הוספת error_message (הודעת שגיאה במקרה של כישלון)
ALTER TABLE public.email_logs
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- הוספת metadata (נתונים נוספים בפורמט JSON)
ALTER TABLE public.email_logs
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- הוספת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS email_logs_message_id_idx ON public.email_logs(message_id);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS email_logs_email_type_idx ON public.email_logs(email_type);

-- הערה: אם רוצים לשמור על הסכמה המינימלית, אין צורך להריץ migration זה.
-- המערכת תעבוד גם ללא השדות הנוספים (הם יירשמו ב-console.log בלבד).

COMMENT ON COLUMN public.email_logs.message_id IS 'Message ID from mail server (for tracking)';
COMMENT ON COLUMN public.email_logs.error_message IS 'Error message if email sending failed';
COMMENT ON COLUMN public.email_logs.metadata IS 'Additional metadata in JSON format';
