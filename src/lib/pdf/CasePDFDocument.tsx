import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import './fonts';
import { translations, PDFLocale } from './translations';

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Rubik',
    fontSize: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 4,
    marginTop: 15,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#666666',
    width: '35%',
    fontSize: 9,
  },
  value: {
    width: '65%',
    fontSize: 10,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  twoColumnsRtl: {
    flexDirection: 'row-reverse',
    gap: 20,
  },
  column: {
    width: '48%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
  },
  textBlock: {
    marginTop: 5,
    padding: 8,
    backgroundColor: '#f8fafc',
    fontSize: 10,
    lineHeight: 1.4,
  },
});

interface CasePDFDocumentProps {
  caseData: any;
  locale: PDFLocale;
  title?: string;
}

// Helper component for field row
function FieldRow({ label, value, isRTL }: { label: string; value: string | number | null | undefined; isRTL: boolean }) {
  const displayValue = value?.toString() || '-';

  if (isRTL) {
    // RTL: Both label and value aligned to right, next to each other
    return (
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <Text style={[styles.value, { width: 'auto', textAlign: 'right' }]}>{displayValue}</Text>
        <Text style={[styles.label, { width: 'auto', textAlign: 'right', marginLeft: 8 }]}>:{label}</Text>
      </View>
    );
  }

  // LTR: Label on left, Value on right, colon after label
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{displayValue}</Text>
    </View>
  );
}

// Helper component for section title
function SectionTitle({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
      {title}
    </Text>
  );
}

export function CasePDFDocument({ caseData, locale, title }: CasePDFDocumentProps) {
  const t = translations[locale];
  const isRTL = locale === 'he';
  const isWedding = caseData.case_type === 'wedding';

  // Calculate totals for cleaning cases
  const totalTransferred = caseData.payments?.reduce(
    (sum: number, payment: any) => sum + (payment.amount_ils || 0),
    0
  ) || 0;
  const activeMonths = caseData.payments?.length || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>
          {title || `${t.caseNumber} ${caseData.case_number}`}
        </Text>

        <View style={styles.divider} />

        {isWedding ? (
          <>
            {/* Couple Names */}
            <Text style={styles.subHeader}>
              {`${caseData.groom_first_name} ${caseData.groom_last_name} ♥ ${caseData.bride_first_name} ${caseData.bride_last_name}`}
            </Text>

            {/* Wedding Details */}
            <SectionTitle title={t.weddingDetails} isRTL={isRTL} />
            <FieldRow label={t.hebrewDate} value={caseData.wedding_date_hebrew} isRTL={isRTL} />
            <FieldRow
              label={t.gregorianDate}
              value={caseData.wedding_date_gregorian ? new Date(caseData.wedding_date_gregorian).toLocaleDateString(isRTL ? 'he-IL' : 'en-US') : null}
              isRTL={isRTL}
            />
            <FieldRow label={t.city} value={caseData.city} isRTL={isRTL} />
            <FieldRow label={t.venue} value={caseData.venue} isRTL={isRTL} />
            <FieldRow label={t.guestsCount} value={caseData.guests_count} isRTL={isRTL} />
            <FieldRow
              label={t.approvedAmount}
              value={caseData.total_cost ? `₪${caseData.total_cost.toLocaleString()}` : null}
              isRTL={isRTL}
            />

            {/* Two Columns: Groom and Bride */}
            <View style={isRTL ? styles.twoColumnsRtl : styles.twoColumns}>
              {/* Groom Details */}
              <View style={styles.column}>
                <SectionTitle title={t.groomDetails} isRTL={isRTL} />
                <FieldRow label={t.fullName} value={`${caseData.groom_first_name} ${caseData.groom_last_name}`} isRTL={isRTL} />
                <FieldRow label={t.idNumber} value={caseData.groom_id} isRTL={isRTL} />
                <FieldRow label={t.school} value={caseData.groom_school} isRTL={isRTL} />
                <FieldRow label={t.fatherName} value={caseData.groom_father_name} isRTL={isRTL} />
                <FieldRow label={t.motherName} value={caseData.groom_mother_name} isRTL={isRTL} />
                <FieldRow label={t.memorialDay} value={caseData.groom_memorial_day} isRTL={isRTL} />
              </View>

              {/* Bride Details */}
              <View style={styles.column}>
                <SectionTitle title={t.brideDetails} isRTL={isRTL} />
                <FieldRow label={t.fullName} value={`${caseData.bride_first_name} ${caseData.bride_last_name}`} isRTL={isRTL} />
                <FieldRow label={t.idNumber} value={caseData.bride_id} isRTL={isRTL} />
                <FieldRow label={t.school} value={caseData.bride_school} isRTL={isRTL} />
                <FieldRow label={t.fatherName} value={caseData.bride_father_name} isRTL={isRTL} />
                <FieldRow label={t.motherName} value={caseData.bride_mother_name} isRTL={isRTL} />
                <FieldRow label={t.memorialDay} value={caseData.bride_memorial_day} isRTL={isRTL} />
              </View>
            </View>

            {/* Contact Info */}
            <SectionTitle title={t.contactInfo} isRTL={isRTL} />
            <FieldRow label={t.address} value={caseData.address} isRTL={isRTL} />
            <FieldRow label={t.phone} value={caseData.contact_phone} isRTL={isRTL} />
            <FieldRow label={t.email} value={caseData.contact_email} isRTL={isRTL} />

            {/* Background Story */}
            {caseData.request_background && (
              <>
                <SectionTitle title={t.background} isRTL={isRTL} />
                <Text style={[styles.textBlock, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {caseData.request_background}
                </Text>
              </>
            )}
          </>
        ) : (
          <>
            {/* Cleaning Case - Family Name */}
            <Text style={styles.subHeader}>{caseData.family_name}</Text>

            {caseData.child_name && (
              <Text style={{ textAlign: 'center', marginBottom: 10 }}>
                {isRTL ? 'ילד' : 'Child'}: {caseData.child_name}
              </Text>
            )}

            {/* Family Details */}
            <SectionTitle title={t.familyDetails} isRTL={isRTL} />
            <FieldRow label={t.familyName} value={caseData.family_name} isRTL={isRTL} />
            <FieldRow label={t.childName} value={caseData.child_name} isRTL={isRTL} />
            <FieldRow label={t.parent1} value={caseData.parent1_name} isRTL={isRTL} />
            <FieldRow label={t.parent1Id} value={caseData.parent1_id} isRTL={isRTL} />
            <FieldRow label={t.parent2} value={caseData.parent2_name} isRTL={isRTL} />
            <FieldRow label={t.parent2Id} value={caseData.parent2_id} isRTL={isRTL} />

            {/* Case Details */}
            <SectionTitle title={t.generalInfo} isRTL={isRTL} />
            <FieldRow
              label={t.startDate}
              value={caseData.start_date ? new Date(caseData.start_date).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' }) : null}
              isRTL={isRTL}
            />
            <FieldRow label={t.city} value={caseData.city} isRTL={isRTL} />
            <FieldRow label={t.totalTransferred} value={`₪${totalTransferred.toLocaleString()}`} isRTL={isRTL} />
            <FieldRow label={t.activeMonths} value={activeMonths} isRTL={isRTL} />

            {/* Contact Info */}
            <SectionTitle title={t.contactInfo} isRTL={isRTL} />
            <FieldRow label={t.address} value={caseData.address} isRTL={isRTL} />
            <FieldRow label={t.phone} value={caseData.contact_phone} isRTL={isRTL} />
            <FieldRow label={t.email} value={caseData.contact_email} isRTL={isRTL} />
          </>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          {t.generatedAt}: {new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US')}
        </Text>
      </Page>
    </Document>
  );
}
