/**
 * Design System Tokens
 *
 * מסמך זה מכיל את כל ההגדרות של שתי גרסאות העיצוב:
 * - Version A: Rich & Dynamic (עשיר ודינמי)
 * - Version B: Elegant & Soft (אלגנטי ורך) - **ACTIVE**
 *
 * כדי להחליף בין גרסאות:
 * 1. שנה את ACTIVE_DESIGN_VERSION למטה
 * 2. הפעל npm run build
 * 3. רענן את הדפדפן
 *
 * @version 1.0
 * @date 2025-10-22
 */

export type DesignVersion = 'A' | 'B';

/**
 * גרסת העיצוב הפעילה כרגע
 *
 * A = Rich & Dynamic (גרדיאנטים חזקים, צבעים עשירים)
 * B = Elegant & Soft (צבעים רכים, עומק עדין) - ברירת מחדל
 */
export const ACTIVE_DESIGN_VERSION = 'B' as DesignVersion;

// ==================== VERSION A: RICH & DYNAMIC ====================

export const DesignTokensA = {
  name: 'Rich & Dynamic',
  description: 'גרסה עשירה עם גרדיאנטים חזקים וצבעים דינמיים',

  colors: {
    // Primary - Blue with strong gradients
    primary: {
      50: 'oklch(0.97 0.02 252)',
      100: 'oklch(0.95 0.04 252)',
      200: 'oklch(0.90 0.08 252)',
      300: 'oklch(0.82 0.12 252)',
      400: 'oklch(0.70 0.18 252)',
      500: 'oklch(0.60 0.20 252)', // Main
      600: 'oklch(0.55 0.22 252)',
      700: 'oklch(0.48 0.20 252)',
      800: 'oklch(0.40 0.16 252)',
      900: 'oklch(0.32 0.12 252)',
    },

    // Success - Vibrant Green
    success: {
      50: 'oklch(0.96 0.03 145)',
      100: 'oklch(0.92 0.06 145)',
      500: 'oklch(0.65 0.18 145)',
      600: 'oklch(0.58 0.20 145)',
      700: 'oklch(0.50 0.18 145)',
    },

    // Warning - Bold Amber
    warning: {
      50: 'oklch(0.97 0.02 85)',
      100: 'oklch(0.94 0.05 85)',
      500: 'oklch(0.75 0.15 85)',
      600: 'oklch(0.68 0.17 85)',
      700: 'oklch(0.60 0.16 85)',
    },

    // Error - Strong Red
    error: {
      50: 'oklch(0.96 0.03 25)',
      100: 'oklch(0.92 0.08 25)',
      500: 'oklch(0.60 0.22 25)',
      600: 'oklch(0.55 0.24 25)',
      700: 'oklch(0.48 0.22 25)',
    },

    // Info - Deep Purple
    info: {
      50: 'oklch(0.96 0.02 260)',
      100: 'oklch(0.92 0.05 260)',
      500: 'oklch(0.60 0.18 260)',
      600: 'oklch(0.55 0.20 260)',
      700: 'oklch(0.48 0.18 260)',
    },
  },

  components: {
    card: {
      border: 'border-2',
      shadow: 'shadow-lg',
      hoverShadow: 'hover:shadow-xl',
      transition: 'transition-all duration-300',
      hoverTransform: 'hover:-translate-y-1',
    },

    button: {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg',
      outline: 'border-2',
    },

    badge: {
      style: 'bg-gradient-to-r',
    },

    statCard: {
      gradient: 'bg-gradient-to-br from-{color}-50 via-{color}-50/50 to-transparent',
      iconBg: 'bg-gradient-to-br from-{color}-500 to-{color}-600',
      iconSize: 'h-12 w-12',
      iconRounded: 'rounded-xl',
    },
  },
} as const;

// ==================== VERSION B: ELEGANT & SOFT ====================

export const DesignTokensB = {
  name: 'Elegant & Distinctive',
  description: 'גרסה אלגנטית עם צבעים ייחודיים ועומק מקצועי',

  colors: {
    // Primary - Deep Teal (distinctive, professional)
    primary: {
      50: 'oklch(0.97 0.02 195)',
      100: 'oklch(0.93 0.04 195)',
      200: 'oklch(0.85 0.07 195)',
      300: 'oklch(0.75 0.09 195)',
      400: 'oklch(0.62 0.11 195)',
      500: 'oklch(0.52 0.12 195)', // Main
      600: 'oklch(0.47 0.12 195)',
      700: 'oklch(0.40 0.10 195)',
      800: 'oklch(0.32 0.08 195)',
      900: 'oklch(0.25 0.06 195)',
    },

    // Success - Rich Emerald
    success: {
      50: 'oklch(0.97 0.02 155)',
      100: 'oklch(0.92 0.05 155)',
      500: 'oklch(0.60 0.16 155)',
      600: 'oklch(0.54 0.17 155)',
      700: 'oklch(0.46 0.15 155)',
    },

    // Warning - Warm Amber
    warning: {
      50: 'oklch(0.98 0.02 70)',
      100: 'oklch(0.94 0.05 70)',
      500: 'oklch(0.72 0.16 70)',
      600: 'oklch(0.65 0.17 70)',
      700: 'oklch(0.58 0.15 70)',
    },

    // Error - Rich Coral
    error: {
      50: 'oklch(0.97 0.03 25)',
      100: 'oklch(0.93 0.06 25)',
      500: 'oklch(0.55 0.20 25)',
      600: 'oklch(0.50 0.21 25)',
      700: 'oklch(0.43 0.19 25)',
    },

    // Info - Deep Violet
    info: {
      50: 'oklch(0.97 0.02 280)',
      100: 'oklch(0.93 0.04 280)',
      500: 'oklch(0.55 0.15 280)',
      600: 'oklch(0.50 0.16 280)',
      700: 'oklch(0.43 0.14 280)',
    },
  },

  components: {
    card: {
      border: 'border border-slate-200',
      shadow: 'shadow-md',
      hoverShadow: 'hover:shadow-xl',
      transition: 'transition-all duration-300',
      hoverTransform: '', // No transform in version B
    },

    button: {
      primary: 'bg-teal-600 hover:bg-teal-700 shadow-sm',
      outline: 'border',
    },

    badge: {
      style: 'border',
    },

    statCard: {
      gradient: 'bg-gradient-to-br from-white to-{color}-50/30',
      iconBg: 'bg-{color}-100 border border-{color}-200',
      iconSize: 'h-11 w-11',
      iconRounded: 'rounded-lg',
    },
  },
} as const;

// ==================== ACTIVE DESIGN TOKENS ====================

/**
 * האסימונים הפעילים כרגע - משתנה לפי ACTIVE_DESIGN_VERSION
 */
export const ActiveDesignTokens = ACTIVE_DESIGN_VERSION === 'B' ? DesignTokensB : DesignTokensA;

// ==================== TAILWIND COLOR MAPPINGS ====================

/**
 * מיפוי צבעים ל-Tailwind CSS
 * משמש ב-tailwind.config.ts
 */
export const getTailwindColors = (version: DesignVersion = ACTIVE_DESIGN_VERSION) => {
  const tokens = version === 'A' ? DesignTokensA : DesignTokensB;

  return {
    primary: {
      50: tokens.colors.primary[50],
      100: tokens.colors.primary[100],
      200: tokens.colors.primary[200],
      300: tokens.colors.primary[300],
      400: tokens.colors.primary[400],
      500: tokens.colors.primary[500],
      600: tokens.colors.primary[600],
      700: tokens.colors.primary[700],
      800: tokens.colors.primary[800],
      900: tokens.colors.primary[900],
      DEFAULT: tokens.colors.primary[600],
    },
    success: {
      50: tokens.colors.success[50],
      100: tokens.colors.success[100],
      500: tokens.colors.success[500],
      600: tokens.colors.success[600],
      700: tokens.colors.success[700],
      DEFAULT: tokens.colors.success[600],
    },
    warning: {
      50: tokens.colors.warning[50],
      100: tokens.colors.warning[100],
      500: tokens.colors.warning[500],
      600: tokens.colors.warning[600],
      700: tokens.colors.warning[700],
      DEFAULT: tokens.colors.warning[600],
    },
    error: {
      50: tokens.colors.error[50],
      100: tokens.colors.error[100],
      500: tokens.colors.error[500],
      600: tokens.colors.error[600],
      700: tokens.colors.error[700],
      DEFAULT: tokens.colors.error[600],
    },
    info: {
      50: tokens.colors.info[50],
      100: tokens.colors.info[100],
      500: tokens.colors.info[500],
      600: tokens.colors.info[600],
      700: tokens.colors.info[700],
      DEFAULT: tokens.colors.info[600],
    },
  };
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * מחזיר את class names של כרטיס סטטיסטיקה לפי הגרסה הפעילה
 */
export const getStatCardClasses = (colorName: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'emerald' | 'orange' | 'indigo') => {
  const { components } = ActiveDesignTokens;

  return {
    card: `${components.card.border} ${components.card.shadow} ${components.card.hoverShadow} ${components.card.transition} ${components.card.hoverTransform}`,
    gradient: components.statCard.gradient.replace('{color}', colorName),
    iconContainer: `${components.statCard.iconSize} ${components.statCard.iconRounded} ${components.statCard.iconBg.replace('{color}', colorName)}`,
  };
};

/**
 * מחזיר את class names של כפתור לפי הגרסה הפעילה
 */
export const getButtonClasses = (variant: 'primary' | 'outline' = 'primary') => {
  const { components } = ActiveDesignTokens;

  if (variant === 'primary') {
    return components.button.primary;
  }

  return components.button.outline;
};

/**
 * מחזיר את class names של badge לפי הגרסה הפעילה
 */
export const getBadgeClasses = (colorName: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'emerald' | 'orange' | 'indigo') => {
  const version = ACTIVE_DESIGN_VERSION;

  if (version === 'A') {
    // Version A: Gradient badges
    return `bg-gradient-to-r from-${colorName}-500 to-${colorName}-600 text-white px-3 py-1`;
  } else {
    // Version B: Soft badges with border
    return `bg-${colorName}-100 text-${colorName}-700 border border-${colorName}-200 px-3 py-1 font-medium`;
  }
};

// ==================== TYPE EXPORTS ====================

export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type ColorName = 'primary' | 'success' | 'warning' | 'error' | 'info';
export type TailwindColorName = 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'emerald' | 'orange' | 'indigo';

// ==================== EXPORT DEFAULT ====================

const designSystem = {
  version: ACTIVE_DESIGN_VERSION,
  tokens: ActiveDesignTokens,
  versionA: DesignTokensA,
  versionB: DesignTokensB,
  tailwindColors: getTailwindColors(),
  utils: {
    getStatCardClasses,
    getButtonClasses,
    getBadgeClasses,
  },
};

export default designSystem;
