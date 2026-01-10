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
    borderRadius: 4,
    fontSize: 10,
  },
});

interface ApplicationPDFDocumentProps {
  formData: any;
  locale: PDFLocale;
  title?: string;
}

// Helper component for field row
function FieldRow({ label, value, isRTL }: { label: string; value: string | number | null | undefined; isRTL: boolean }) {
  const displayValue = value?.toString() || '-';

  if (isRTL) {
    // RTL: Both label and value aligned to right, next to each other, colon before label
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

export function ApplicationPDFDocument({ formData, locale, title }: ApplicationPDFDocumentProps) {
  const t = translations[locale];
  const isRTL = locale === 'he';

  const weddingInfo = formData.wedding_info || {};
  const groomInfo = formData.groom_info || {};
  const brideInfo = formData.bride_info || {};
  const additionalInfo = formData.additional_info || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>
          {title || t.applicationForm}
        </Text>

        <View style={styles.divider} />

        {/* Wedding Info Section */}
        <SectionTitle title={t.weddingInfo} isRTL={isRTL} />
        <FieldRow label={t.hebrewDate} value={weddingInfo.date_hebrew} isRTL={isRTL} />
        <FieldRow label={t.gregorianDate} value={weddingInfo.date_gregorian} isRTL={isRTL} />
        <FieldRow label={t.city} value={weddingInfo.city} isRTL={isRTL} />
        <FieldRow label={t.venue} value={weddingInfo.venue} isRTL={isRTL} />
        <FieldRow label={t.guestsCount} value={weddingInfo.guests_count} isRTL={isRTL} />
        <FieldRow
          label={t.totalCost}
          value={weddingInfo.total_cost ? `₪${weddingInfo.total_cost.toLocaleString()}` : null}
          isRTL={isRTL}
        />

        {/* Two Columns: Groom and Bride */}
        <View style={isRTL ? styles.twoColumnsRtl : styles.twoColumns}>
          {/* Groom Details */}
          <View style={styles.column}>
            <SectionTitle title={t.groomDetails} isRTL={isRTL} />
            <FieldRow
              label={t.fullName}
              value={`${groomInfo.first_name || ''} ${groomInfo.last_name || ''}`.trim()}
              isRTL={isRTL}
            />
            <FieldRow label={t.idNumber} value={groomInfo.id_number || groomInfo.id} isRTL={isRTL} />
            <FieldRow label={t.phone} value={groomInfo.phone} isRTL={isRTL} />
            <FieldRow label={t.email} value={groomInfo.email} isRTL={isRTL} />
            <FieldRow label={t.school} value={groomInfo.school} isRTL={isRTL} />
            <FieldRow label={t.city} value={groomInfo.city} isRTL={isRTL} />
            <FieldRow label={t.address} value={groomInfo.address} isRTL={isRTL} />
            <FieldRow label={t.fatherName} value={groomInfo.father_name} isRTL={isRTL} />
            <FieldRow label={t.fatherOccupation} value={groomInfo.father_occupation} isRTL={isRTL} />
            <FieldRow label={t.motherName} value={groomInfo.mother_name} isRTL={isRTL} />
            <FieldRow label={t.motherOccupation} value={groomInfo.mother_occupation} isRTL={isRTL} />
            <FieldRow label={t.memorialDay} value={groomInfo.memorial_day} isRTL={isRTL} />
          </View>

          {/* Bride Details */}
          <View style={styles.column}>
            <SectionTitle title={t.brideDetails} isRTL={isRTL} />
            <FieldRow
              label={t.fullName}
              value={`${brideInfo.first_name || ''} ${brideInfo.last_name || ''}`.trim()}
              isRTL={isRTL}
            />
            <FieldRow label={t.idNumber} value={brideInfo.id_number || brideInfo.id} isRTL={isRTL} />
            <FieldRow label={t.phone} value={brideInfo.phone} isRTL={isRTL} />
            <FieldRow label={t.email} value={brideInfo.email} isRTL={isRTL} />
            <FieldRow label={t.school} value={brideInfo.school} isRTL={isRTL} />
            <FieldRow label={t.city} value={brideInfo.city} isRTL={isRTL} />
            <FieldRow label={t.address} value={brideInfo.address} isRTL={isRTL} />
            <FieldRow label={t.fatherName} value={brideInfo.father_name} isRTL={isRTL} />
            <FieldRow label={t.fatherOccupation} value={brideInfo.father_occupation} isRTL={isRTL} />
            <FieldRow label={t.motherName} value={brideInfo.mother_name} isRTL={isRTL} />
            <FieldRow label={t.motherOccupation} value={brideInfo.mother_occupation} isRTL={isRTL} />
            <FieldRow label={t.memorialDay} value={brideInfo.memorial_day} isRTL={isRTL} />
          </View>
        </View>

        {/* Additional Info Section */}
        {(additionalInfo.background || additionalInfo.notes) && (
          <>
            <SectionTitle title={t.additionalInfo} isRTL={isRTL} />
            {additionalInfo.background && (
              <View style={{ marginBottom: 10 }}>
                <Text style={[styles.label, { marginBottom: 4, textAlign: isRTL ? 'right' : 'left', width: '100%' }]}>
                  {isRTL ? `:${t.background}` : `${t.background}:`}
                </Text>
                <Text style={[styles.textBlock, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {additionalInfo.background}
                </Text>
              </View>
            )}
            {additionalInfo.notes && (
              <View style={{ marginBottom: 10 }}>
                <Text style={[styles.label, { marginBottom: 4, textAlign: isRTL ? 'right' : 'left', width: '100%' }]}>
                  {isRTL ? `:${t.notes}` : `${t.notes}:`}
                </Text>
                <Text style={[styles.textBlock, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {additionalInfo.notes}
                </Text>
              </View>
            )}
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
