'use client';

/**
 * FormRenderer - קומפוננטה להצגת נתוני טופס בצורה קריאה
 *
 * מציג נתוני JSON של טופס בצורה מעוצבת ונוחה לקריאה
 * תומך בטפסי חתונה וניקיון (כרגע חתונה)
 *
 * עקרונות SOLID:
 * - Single Responsibility: רק הצגת נתונים
 * - Open/Closed: ניתן להרחבה לסוגי טפסים נוספים
 * - Interface Segregation: ממשקים ספציפיים לכל סוג טופס
 *
 * לפי: DESIGN_SYSTEM.md (Version B - Soft & Matte)
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, MapPin, DollarSign, Users, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Types
export interface WeddingFormData {
  wedding_info?: {
    date_hebrew?: string;
    date_gregorian?: string;
    city?: string;
    venue?: string;
    guests_count?: number;
    total_cost?: number;
  };
  groom_info?: {
    first_name?: string;
    last_name?: string;
    id?: string;
    id_number?: string;
    school?: string;
    father_name?: string;
    father_occupation?: string;
    mother_name?: string;
    mother_occupation?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    memorial_day?: string;
    background?: string;
  };
  bride_info?: {
    first_name?: string;
    last_name?: string;
    id?: string;
    id_number?: string;
    school?: string;
    father_name?: string;
    father_occupation?: string;
    mother_name?: string;
    mother_occupation?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    memorial_day?: string;
    background?: string;
  };
  additional_info?: {
    background?: string;
    notes?: string;
  };
}

interface FormRendererProps {
  /**
   * נתוני הטופס
   */
  formData: WeddingFormData;

  /**
   * סוג הטופס
   */
  caseType: 'wedding' | 'cleaning';

  /**
   * האם להציג כפורמט ייצוא (PDF) או תצוגה רגילה
   */
  exportMode?: boolean;
}

export function FormRenderer({
  formData,
  caseType,
  exportMode = false,
}: FormRendererProps) {
  const t = useTranslations('applicants.view_dialog');

  if (caseType === 'wedding') {
    return <WeddingFormView formData={formData} t={t} exportMode={exportMode} />;
  }

  // TODO: הוסף תמיכה בטפסי ניקיון
  return <div>סוג טופס לא נתמך</div>;
}

/**
 * תצוגת טופס חתונה
 */
function WeddingFormView({
  formData,
  t,
  exportMode,
}: {
  formData: WeddingFormData;
  t: any;
  exportMode: boolean;
}) {
  const weddingInfo = formData.wedding_info || {};
  const groomInfo = formData.groom_info || {};
  const brideInfo = formData.bride_info || {};
  const additionalInfo = formData.additional_info || {};

  // גרסה לייצוא - עיצוב פשוט ונקי (רק HEX/RGB - לא oklch!)
  if (exportMode) {
    return (
      <div style={{ width: '100%', backgroundColor: '#ffffff' }}>
        {/* Wedding Info */}
        <div style={{ marginBottom: '15mm', backgroundColor: '#ffffff' }}>
          <div
            style={{
              fontSize: '14pt',
              fontWeight: 'bold',
              color: '#1e40af',
              marginBottom: '5mm',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '3mm',
              backgroundColor: '#ffffff',
            }}
          >
            📅 {t('wedding_info.title')}
          </div>
          <div style={{ paddingTop: '3mm' }}>
            <ExportFieldInline
              label={t('wedding_info.date_hebrew')}
              value={weddingInfo.date_hebrew}
            />
            <ExportFieldInline
              label={t('wedding_info.date_gregorian')}
              value={weddingInfo.date_gregorian}
            />
            <ExportFieldInline label={t('wedding_info.city')} value={weddingInfo.city} />
            <ExportFieldInline
              label={t('wedding_info.guests_count')}
              value={weddingInfo.guests_count}
            />
            <ExportFieldInline
              label={t('wedding_info.total_cost')}
              value={weddingInfo.total_cost ? `₪${weddingInfo.total_cost.toLocaleString()}` : '-'}
              fullWidth
            />
          </div>
        </div>

        {/* Groom Info */}
        <div style={{ marginBottom: '15mm', backgroundColor: '#ffffff' }}>
          <div
            style={{
              fontSize: '14pt',
              fontWeight: 'bold',
              color: '#1e40af',
              marginBottom: '5mm',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '3mm',
              backgroundColor: '#ffffff',
            }}
          >
            👔 {t('groom_info.title')}
          </div>
          <div style={{ paddingTop: '3mm' }}>
            <ExportFieldInline
              label={t('groom_info.name')}
              value={`${groomInfo.first_name || ''} ${groomInfo.last_name || ''}`.trim()}
            />
            <ExportFieldInline label={t('groom_info.id')} value={groomInfo.id_number || groomInfo.id} />
            <ExportFieldInline label={t('groom_info.phone')} value={groomInfo.phone} />
            <ExportFieldInline label={t('groom_info.email')} value={groomInfo.email} />
            {groomInfo.school && <ExportFieldInline label="בית ספר" value={groomInfo.school} />}
            {groomInfo.city && <ExportFieldInline label="עיר" value={groomInfo.city} />}
            <ExportFieldInline
              label={t('groom_info.address')}
              value={groomInfo.address}
              fullWidth
            />
            {groomInfo.father_name && (
              <ExportFieldInline label="שם האב" value={groomInfo.father_name} />
            )}
            {groomInfo.father_occupation && (
              <ExportFieldInline label="עיסוק האב" value={groomInfo.father_occupation} />
            )}
            {groomInfo.mother_name && (
              <ExportFieldInline label="שם האם" value={groomInfo.mother_name} />
            )}
            {groomInfo.mother_occupation && (
              <ExportFieldInline label="עיסוק האם" value={groomInfo.mother_occupation} />
            )}
            {groomInfo.memorial_day && (
              <ExportFieldInline
                label={t('groom_info.memorial_day')}
                value={groomInfo.memorial_day}
                fullWidth
              />
            )}
            {groomInfo.background && (
              <ExportFieldInline label="רקע" value={groomInfo.background} fullWidth />
            )}
          </div>
        </div>

        {/* Bride Info */}
        <div style={{ marginBottom: '15mm', backgroundColor: '#ffffff' }}>
          <div
            style={{
              fontSize: '14pt',
              fontWeight: 'bold',
              color: '#1e40af',
              marginBottom: '5mm',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '3mm',
              backgroundColor: '#ffffff',
            }}
          >
            👰 {t('bride_info.title')}
          </div>
          <div style={{ paddingTop: '3mm' }}>
            <ExportFieldInline
              label={t('bride_info.name')}
              value={`${brideInfo.first_name || ''} ${brideInfo.last_name || ''}`.trim()}
            />
            <ExportFieldInline label={t('bride_info.id')} value={brideInfo.id_number || brideInfo.id} />
            <ExportFieldInline label={t('bride_info.phone')} value={brideInfo.phone} />
            <ExportFieldInline label={t('bride_info.email')} value={brideInfo.email} />
            {brideInfo.school && <ExportFieldInline label="בית ספר" value={brideInfo.school} />}
            {brideInfo.city && <ExportFieldInline label="עיר" value={brideInfo.city} />}
            <ExportFieldInline
              label={t('bride_info.address')}
              value={brideInfo.address}
              fullWidth
            />
            {brideInfo.father_name && (
              <ExportFieldInline label="שם האב" value={brideInfo.father_name} />
            )}
            {brideInfo.father_occupation && (
              <ExportFieldInline label="עיסוק האב" value={brideInfo.father_occupation} />
            )}
            {brideInfo.mother_name && (
              <ExportFieldInline label="שם האם" value={brideInfo.mother_name} />
            )}
            {brideInfo.mother_occupation && (
              <ExportFieldInline label="עיסוק האם" value={brideInfo.mother_occupation} />
            )}
            {brideInfo.memorial_day && (
              <ExportFieldInline
                label={t('bride_info.memorial_day')}
                value={brideInfo.memorial_day}
                fullWidth
              />
            )}
            {brideInfo.background && (
              <ExportFieldInline label="רקע" value={brideInfo.background} fullWidth />
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(additionalInfo.background || additionalInfo.notes) && (
          <div style={{ marginBottom: '15mm', backgroundColor: '#ffffff' }}>
            <div
              style={{
                fontSize: '14pt',
                fontWeight: 'bold',
                color: '#1e40af',
                marginBottom: '5mm',
                borderBottom: '2px solid #3b82f6',
                paddingBottom: '3mm',
                backgroundColor: '#ffffff',
              }}
            >
              📝 מידע נוסף
            </div>
            <div style={{ paddingTop: '3mm' }}>
              {additionalInfo.background && (
                <ExportFieldInline
                  label="רקע"
                  value={additionalInfo.background}
                  fullWidth
                />
              )}
              {additionalInfo.notes && (
                <ExportFieldInline label="הערות" value={additionalInfo.notes} fullWidth />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // גרסה רגילה - עם עיצוב Version B
  return (
    <div className="space-y-6">
      {/* Wedding Info - Version B: Soft */}
      <Card className="border-2 border-blue-100 bg-blue-50/30 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            📅 {t('wedding_info.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <FormField label={t('wedding_info.date_hebrew')} value={weddingInfo.date_hebrew} />
            <FormField
              label={t('wedding_info.date_gregorian')}
              value={weddingInfo.date_gregorian}
            />
            <FormField label={t('wedding_info.city')} value={weddingInfo.city} />
            <FormField label={t('wedding_info.guests_count')} value={weddingInfo.guests_count} />
            <FormField
              label={t('wedding_info.total_cost')}
              value={
                weddingInfo.total_cost ? `₪${weddingInfo.total_cost.toLocaleString()}` : null
              }
              fullWidth
              highlight
            />
          </div>
        </CardContent>
      </Card>

      {/* Groom Info - Version B: Soft */}
      <Card className="border-2 border-slate-200 bg-slate-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            👔 {t('groom_info.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <FormField
              label={t('groom_info.name')}
              value={`${groomInfo.first_name || ''} ${groomInfo.last_name || ''}`.trim()}
            />
            <FormField label={t('groom_info.id')} value={groomInfo.id_number || groomInfo.id} />
            <FormField label={t('groom_info.phone')} value={groomInfo.phone} />
            <FormField label={t('groom_info.email')} value={groomInfo.email} />
            {groomInfo.school && <FormField label="בית ספר" value={groomInfo.school} />}
            {groomInfo.city && <FormField label="עיר" value={groomInfo.city} />}
            <FormField label={t('groom_info.address')} value={groomInfo.address} fullWidth />
            {groomInfo.father_name && (
              <FormField label="שם האב" value={groomInfo.father_name} />
            )}
            {groomInfo.father_occupation && (
              <FormField label="עיסוק האב" value={groomInfo.father_occupation} />
            )}
            {groomInfo.mother_name && (
              <FormField label="שם האם" value={groomInfo.mother_name} />
            )}
            {groomInfo.mother_occupation && (
              <FormField label="עיסוק האם" value={groomInfo.mother_occupation} />
            )}
            {groomInfo.memorial_day && (
              <FormField
                label={t('groom_info.memorial_day')}
                value={groomInfo.memorial_day}
                fullWidth
              />
            )}
            {groomInfo.background && (
              <FormField label="רקע" value={groomInfo.background} fullWidth multiline />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bride Info - Version B: Soft */}
      <Card className="border-2 border-slate-200 bg-slate-50/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            👰 {t('bride_info.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <FormField
              label={t('bride_info.name')}
              value={`${brideInfo.first_name || ''} ${brideInfo.last_name || ''}`.trim()}
            />
            <FormField label={t('bride_info.id')} value={brideInfo.id_number || brideInfo.id} />
            <FormField label={t('bride_info.phone')} value={brideInfo.phone} />
            <FormField label={t('bride_info.email')} value={brideInfo.email} />
            {brideInfo.school && <FormField label="בית ספר" value={brideInfo.school} />}
            {brideInfo.city && <FormField label="עיר" value={brideInfo.city} />}
            <FormField label={t('bride_info.address')} value={brideInfo.address} fullWidth />
            {brideInfo.father_name && (
              <FormField label="שם האב" value={brideInfo.father_name} />
            )}
            {brideInfo.father_occupation && (
              <FormField label="עיסוק האב" value={brideInfo.father_occupation} />
            )}
            {brideInfo.mother_name && (
              <FormField label="שם האם" value={brideInfo.mother_name} />
            )}
            {brideInfo.mother_occupation && (
              <FormField label="עיסוק האם" value={brideInfo.mother_occupation} />
            )}
            {brideInfo.memorial_day && (
              <FormField
                label={t('bride_info.memorial_day')}
                value={brideInfo.memorial_day}
                fullWidth
              />
            )}
            {brideInfo.background && (
              <FormField label="רקע" value={brideInfo.background} fullWidth multiline />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info - אם קיים */}
      {(additionalInfo.background || additionalInfo.notes) && (
        <Card className="border-2 border-slate-200 bg-slate-50/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              📝 מידע נוסף
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {additionalInfo.background && (
                <FormField label="רקע" value={additionalInfo.background} fullWidth multiline />
              )}
              {additionalInfo.notes && (
                <FormField label="הערות" value={additionalInfo.notes} fullWidth multiline />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * רכיב עזר להצגת שדה - גרסה רגילה
 */
function FormField({
  label,
  value,
  fullWidth = false,
  highlight = false,
  multiline = false,
}: {
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
  highlight?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-slate-600 font-medium mb-1">{label}:</div>
      <div
        className={`text-slate-900 border-b pb-2 ${
          highlight ? 'font-bold text-blue-900 text-base' : ''
        } ${multiline ? 'whitespace-pre-wrap' : ''}`}
      >
        {value || '-'}
      </div>
    </div>
  );
}

/**
 * רכיב עזר להצגת שדה - גרסת ייצוא (רק HEX/RGB!)
 */
function ExportFieldInline({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | number | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: '5mm',
        display: fullWidth ? 'block' : 'inline-block',
        width: fullWidth ? '100%' : '48%',
        verticalAlign: 'top',
        paddingLeft: fullWidth ? '0' : '2mm',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '10pt',
          color: '#333333',
          marginBottom: '1mm',
          backgroundColor: '#ffffff',
        }}
      >
        {label}:
      </div>
      <div
        style={{
          fontSize: '11pt',
          color: '#000000',
          borderBottom: '1px solid #dddddd',
          paddingBottom: '2mm',
          backgroundColor: '#ffffff',
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}
