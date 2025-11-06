'use client';

import { CaseWithRelations, CaseType } from '@/types/case.types';
import { formatCurrency } from '@/lib/utils/format';
import { ExportSection, ExportField } from '@/components/shared/ExportDocument';

interface CaseSummaryProps {
  caseData: CaseWithRelations;
}

/**
 * CaseSummary - Component for displaying case summary in PDF export
 *
 * This component provides the content structure for PDF export
 * using the shared ExportDocument component
 */
export function CaseSummary({ caseData }: CaseSummaryProps) {
  const isWedding = caseData.case_type === CaseType.WEDDING;

  // Calculate total transferred for cleaning cases
  const totalTransferred = caseData.payments?.reduce(
    (sum, payment) => sum + payment.amount_ils,
    0
  ) || 0;

  // Count active months for cleaning cases
  const activeMonths = caseData.payments?.length || 0;

  return (
    <div>
      {/* Title */}
      <div style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '4mm', borderBottom: '1.5px solid #000', paddingBottom: '2mm', textAlign: 'center' }}>
        תיק מספר {caseData.case_number}
      </div>

      {/* Case Type & Status */}
      <ExportSection title="מידע כללי" icon="📋">
        <ExportField label="סוג תיק" value={isWedding ? 'חתונה' : 'ניקיון'} />
        <ExportField label="סטטוס" value={caseData.status} />
        <ExportField label="תאריך יצירה" value={
          caseData.created_at
            ? new Date(caseData.created_at).toLocaleDateString('he-IL')
            : null
        } />
      </ExportSection>

      {isWedding ? (
        <>
          {/* Names */}
          <div style={{ marginBottom: '6mm', textAlign: 'center' }}>
            <div style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: '2mm' }}>
              {caseData.groom_first_name} {caseData.groom_last_name} ♥ {caseData.bride_first_name} {caseData.bride_last_name}
            </div>
          </div>

          {/* Wedding Details */}
          <ExportSection title="פרטי החתונה" icon="💒">
            <ExportField label="תאריך עברי" value={caseData.wedding_date_hebrew} />
            <ExportField label="תאריך לועזי" value={
              caseData.wedding_date_gregorian
                ? new Date(caseData.wedding_date_gregorian).toLocaleDateString('he-IL')
                : null
            } />
            <ExportField label="עיר" value={caseData.city} />
            <ExportField label="מקום האירוע" value={caseData.venue} />
            <ExportField label="מספר אורחים" value={caseData.guests_count} />
            <ExportField label="סכום מאושר" value={
              caseData.total_cost ? formatCurrency(caseData.total_cost) : null
            } fullWidth />
          </ExportSection>

          {/* Groom Info */}
          <ExportSection title="פרטי החתן" icon="🤵">
            <ExportField label="שם מלא" value={`${caseData.groom_first_name} ${caseData.groom_last_name}`} />
            <ExportField label="תעודת זהות" value={caseData.groom_id} />
            <ExportField label="בית ספר" value={caseData.groom_school} />
            <ExportField label="שם האב" value={caseData.groom_father_name} />
            <ExportField label="שם האם" value={caseData.groom_mother_name} />
            <ExportField label="יום זיכרון" value={caseData.groom_memorial_day} />
          </ExportSection>

          {/* Bride Info */}
          <ExportSection title="פרטי הכלה" icon="👰">
            <ExportField label="שם מלא" value={`${caseData.bride_first_name} ${caseData.bride_last_name}`} />
            <ExportField label="תעודת זהות" value={caseData.bride_id} />
            <ExportField label="בית ספר" value={caseData.bride_school} />
            <ExportField label="שם האב" value={caseData.bride_father_name} />
            <ExportField label="שם האם" value={caseData.bride_mother_name} />
            <ExportField label="יום זיכרון" value={caseData.bride_memorial_day} />
          </ExportSection>

          {/* Contact Info */}
          <ExportSection title="פרטי קשר" icon="📞">
            <ExportField label="כתובת" value={caseData.address} fullWidth />
            <ExportField label="טלפון" value={caseData.contact_phone} />
            <ExportField label="אימייל" value={caseData.contact_email} />
          </ExportSection>
        </>
      ) : (
        <>
          {/* Family Name */}
          <div style={{ marginBottom: '6mm', textAlign: 'center' }}>
            <div style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: '2mm' }}>
              {caseData.family_name}
            </div>
            {caseData.child_name && (
              <div style={{ fontSize: '12pt' }}>
                ילד: {caseData.child_name}
              </div>
            )}
          </div>

          {/* Family Details */}
          <ExportSection title="פרטי משפחה" icon="👨‍👩‍👧‍👦">
            <ExportField label="שם משפחה" value={caseData.family_name} />
            <ExportField label="שם הילד" value={caseData.child_name} />
            <ExportField label="הורה 1" value={caseData.parent1_name} />
            <ExportField label="תעודת זהות הורה 1" value={caseData.parent1_id} />
            <ExportField label="הורה 2" value={caseData.parent2_name} />
            <ExportField label="תעודת זהות הורה 2" value={caseData.parent2_id} />
          </ExportSection>

          {/* Case Details */}
          <ExportSection title="פרטי התיק" icon="📋">
            <ExportField label="תאריך התחלה" value={
              caseData.start_date
                ? new Date(caseData.start_date).toLocaleDateString('he-IL', {
                    month: 'long',
                    year: 'numeric'
                  })
                : null
            } />
            <ExportField label="עיר" value={caseData.city} />
            <ExportField label="סך הכסף שהועבר" value={formatCurrency(totalTransferred)} />
            <ExportField label="חודשים פעילים" value={activeMonths} />
          </ExportSection>

          {/* Contact Info */}
          <ExportSection title="פרטי קשר" icon="📞">
            <ExportField label="כתובת" value={caseData.address} fullWidth />
            <ExportField label="טלפון ראשי" value={caseData.contact_phone} />
            <ExportField label="טלפון משני" value={caseData.contact_phone2} />
            <ExportField label="טלפון נוסף" value={caseData.contact_phone3} />
            <ExportField label="אימייל" value={caseData.contact_email} />
          </ExportSection>
        </>
      )}

      {/* Payments Information */}
      {caseData.payments && caseData.payments.length > 0 && (
        <ExportSection title="היסטוריית תשלומים" icon="💰">
          {caseData.payments.map((payment, index) => (
            <div key={payment.id} style={{
              marginBottom: '3mm',
              padding: '2mm',
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>
                תשלום #{index + 1}
              </div>
              <div style={{ fontSize: '9pt' }}>
                <ExportField label="תאריך" value={
                  payment.created_at
                    ? new Date(payment.created_at).toLocaleDateString('he-IL')
                    : null
                } />
                <ExportField label="סכום בדולר" value={`$${payment.amount_usd?.toLocaleString() || '0'}`} />
                <ExportField label="סכום בשקל" value={formatCurrency(payment.amount_ils)} />
                <ExportField label="שער" value={payment.exchange_rate} />
                <ExportField label="סטטוס" value={payment.status} />
              </div>
            </div>
          ))}
        </ExportSection>
      )}
    </div>
  );
}