/**
 * Hebrew translations for Israeli banks and their branches
 * Source: Bank of Israel and data.gov.il
 */

export const BANK_NAMES_HE: Record<string, string> = {
  '2': 'בנק הפועלים',
  '4': 'בנק יהב לעובדי מדינה',
  '9': 'בנק הדואר',
  '10': 'בנק לאומי',
  '11': 'בנק דיסקונט',
  '12': 'בנק הפועלים',
  '13': 'בנק איגוד',
  '14': 'בנק אוצר החייל',
  '17': 'בנק מרכנתיל',
  '18': 'One Zero בנק דיגיטלי',
  '20': 'בנק מזרחי טפחות',
  '22': 'Citibank',
  '23': 'HSBC',
  '26': 'UBank',
  '31': 'הבנק הבינלאומי',
  '34': 'בנק ערבי ישראלי',
  '46': 'בנק מסד',
  '52': 'בנק פועלי אגודת ישראל',
  '54': 'בנק ירושלים',
};

/**
 * Common branch name translations
 * Used for partial matching and translation
 */
export const BRANCH_NAME_TRANSLATIONS: Record<string, string> = {
  // Common terms
  'Head Office': 'משרד ראשי',
  'Main Branch': 'סניף ראשי',
  'Branch': 'סניף',
  'Center': 'מרכז',
  'Business': 'עסקי',
  'Private Banking': 'בנקאות פרטית',
  'Corporates': 'תאגידים',
  'Suppliers': 'ספקים',
  'ALM': 'ניהול נכסים והתחייבויות',

  // Cities - common ones
  'TEL AVIV': 'תל אביב',
  'JERUSALEM': 'ירושלים',
  'HAIFA': 'חיפה',
  'BEER SHEBA': 'באר שבע',
  'RISHON LEZION': 'ראשון לציון',
  'PETAH TIKVA': 'פתח תקווה',
  'ASHDOD': 'אשדוד',
  'NETANYA': 'נתניה',
  'HOLON': 'חולון',
  'BNEI BRAK': 'בני ברק',
  'RAMAT GAN': 'רמת גן',
  'ASHKELON': 'אשקלון',
  'REHOVOT': 'רחובות',
  'BAT YAM': 'בת ים',
  'KFAR SABA': 'כפר סבא',
  'HERZLIYA': 'הרצליה',
  'HADERA': 'חדרה',
  'MODIIN': 'מודיעין',
  'NAZARETH': 'נצרת',
  'LOD': 'לוד',
  'RAMLA': 'רמלה',
  'RAANANA': 'רעננה',
  'GIVATAYIM': 'גבעתיים',
};

/**
 * Translates city name from English to Hebrew
 */
export function translateCityToHebrew(city: string | undefined): string | undefined {
  if (!city) return undefined;

  const cityUpper = city.toUpperCase();
  for (const [en, he] of Object.entries(BRANCH_NAME_TRANSLATIONS)) {
    if (cityUpper.includes(en.toUpperCase())) {
      return city.replace(new RegExp(en, 'gi'), he);
    }
  }

  return city;
}

/**
 * Translates branch name from English to Hebrew
 * Uses partial matching for common terms
 */
export function translateBranchNameToHebrew(name: string | undefined): string | undefined {
  if (!name) return undefined;

  let translated = name;
  for (const [en, he] of Object.entries(BRANCH_NAME_TRANSLATIONS)) {
    translated = translated.replace(new RegExp(en, 'gi'), he);
  }

  return translated;
}
