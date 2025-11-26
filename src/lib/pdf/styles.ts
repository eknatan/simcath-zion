import { StyleSheet } from '@react-pdf/renderer';

export const COLORS = {
  primary: '#1e40af',
  primaryLight: '#3b82f6',
  text: '#000000',
  textMuted: '#666666',
  border: '#e5e7eb',
};

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Rubik',
    fontSize: 10,
    direction: 'rtl',
  },
  pageEn: {
    padding: 40,
    fontFamily: 'Rubik',
    fontSize: 10,
    direction: 'ltr',
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
  },
  labelRtl: {
    fontWeight: 'bold',
    color: '#666666',
    width: '35%',
    textAlign: 'right',
  },
  value: {
    width: '65%',
  },
  valueRtl: {
    width: '65%',
    textAlign: 'right',
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
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e40af',
    marginVertical: 10,
  },
  fieldValue: {
    fontSize: 10,
    color: '#000000',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666666',
  },
});
