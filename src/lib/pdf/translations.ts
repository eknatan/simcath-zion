export type PDFLocale = 'he' | 'en';

export const translations: Record<PDFLocale, Record<string, string>> = {
  he: {
    // General headers
    caseNumber: 'תיק מספר',
    generatedAt: 'נוצר בתאריך',
    page: 'עמוד',
    of: 'מתוך',

    // General info
    generalInfo: 'מידע כללי',
    caseType: 'סוג תיק',
    status: 'סטטוס',
    createdAt: 'תאריך יצירה',
    wedding: 'חתונה',
    cleaning: 'ניקיון',

    // Wedding details
    weddingDetails: 'פרטי החתונה',
    hebrewDate: 'תאריך עברי',
    gregorianDate: 'תאריך לועזי',
    city: 'עיר',
    venue: 'מקום האירוע',
    guestsCount: 'מספר אורחים',
    totalCost: 'עלות כוללת',

    // Groom details
    groomDetails: 'פרטי החתן',
    fullName: 'שם מלא',
    idNumber: 'תעודת זהות',
    school: 'ישיבה/בית ספר',
    fatherName: 'שם האב',
    motherName: 'שם האם',
    memorialDay: 'יום זיכרון',
    phone: 'טלפון',
    email: 'אימייל',
    address: 'כתובת',

    // Bride details
    brideDetails: 'פרטי הכלה',

    // Contact info
    contactInfo: 'פרטי קשר',

    // Family (cleaning)
    familyDetails: 'פרטי משפחה',
    familyName: 'שם משפחה',
    childName: 'שם הילד',
    parent1: 'הורה 1',
    parent1Id: 'ת.ז. הורה 1',
    parent2: 'הורה 2',
    parent2Id: 'ת.ז. הורה 2',
    startDate: 'תאריך התחלה',
    totalTransferred: 'סך הכסף שהועבר',
    activeMonths: 'חודשים פעילים',

    // Payments
    paymentHistory: 'היסטוריית תשלומים',
    payment: 'תשלום',
    date: 'תאריך',
    amountUSD: 'סכום בדולר',
    amountILS: 'סכום בשקל',
    exchangeRate: 'שער חליפין',

    // Application form
    applicationForm: 'טופס בקשה',
    weddingInfo: 'פרטי החתונה',
    additionalInfo: 'מידע נוסף',
    background: 'רקע',
    notes: 'הערות',
    fatherOccupation: 'עיסוק האב',
    motherOccupation: 'עיסוק האם',
  },
  en: {
    // General headers
    caseNumber: 'Case Number',
    generatedAt: 'Generated at',
    page: 'Page',
    of: 'of',

    // General info
    generalInfo: 'General Information',
    caseType: 'Case Type',
    status: 'Status',
    createdAt: 'Created At',
    wedding: 'Wedding',
    cleaning: 'Cleaning',

    // Wedding details
    weddingDetails: 'Wedding Details',
    hebrewDate: 'Hebrew Date',
    gregorianDate: 'Gregorian Date',
    city: 'City',
    venue: 'Venue',
    guestsCount: 'Guests Count',
    totalCost: 'Total Cost',

    // Groom details
    groomDetails: 'Groom Details',
    fullName: 'Full Name',
    idNumber: 'ID Number',
    school: 'School/Yeshiva',
    fatherName: 'Father Name',
    motherName: 'Mother Name',
    memorialDay: 'Memorial Day',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',

    // Bride details
    brideDetails: 'Bride Details',

    // Contact info
    contactInfo: 'Contact Information',

    // Family (cleaning)
    familyDetails: 'Family Details',
    familyName: 'Family Name',
    childName: 'Child Name',
    parent1: 'Parent 1',
    parent1Id: 'Parent 1 ID',
    parent2: 'Parent 2',
    parent2Id: 'Parent 2 ID',
    startDate: 'Start Date',
    totalTransferred: 'Total Transferred',
    activeMonths: 'Active Months',

    // Payments
    paymentHistory: 'Payment History',
    payment: 'Payment',
    date: 'Date',
    amountUSD: 'Amount (USD)',
    amountILS: 'Amount (ILS)',
    exchangeRate: 'Exchange Rate',

    // Application form
    applicationForm: 'Application Form',
    weddingInfo: 'Wedding Information',
    additionalInfo: 'Additional Information',
    background: 'Background',
    notes: 'Notes',
    fatherOccupation: 'Father Occupation',
    motherOccupation: 'Mother Occupation',
  },
};
