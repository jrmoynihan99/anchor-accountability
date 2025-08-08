// app/constants/Typography.ts

export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 11, // Used for stat labels, character count
    sm: 12, // Used for character count, small badges
    base: 14, // Used for tab labels, subtitles, references, activity dates
    md: 15, // Used for descriptions, dates on cards
    lg: 16, // Used for default text, button text, content text
    xl: 18, // Used for section titles, quote authors
    "2xl": 20, // Used for titles, stat values, icon text
    "3xl": 24, // Used for large button text, pill text
    "4xl": 28, // Used for modal titles
    "5xl": 30, // Used for verse text
    "6xl": 32, // Used for ThemedText titles
    "7xl": 48, // Used for timer text, emojis
    "8xl": 70, // Used for large quote marks
  },

  // Font Weights
  fontWeight: {
    light: "200" as const, // Used for quote marks
    normal: "400" as const, // Default weight
    medium: "500" as const, // Used for descriptions, dates, various text
    semibold: "600" as const, // Used for tab labels, button text, titles
    bold: "700" as const, // Used for titles, modal titles, stat values
  },

  // Line Heights
  lineHeight: {
    tight: 22, // Used for descriptions
    snug: 24, // Used for default text, titles
    normal: 30, // Used for links
    relaxed: 32, // Used for large titles
    loose: 40, // Used for verse text
    extraLoose: 70, // Used for large quote marks
  },

  // Common Text Styles
  styles: {
    // Body text styles
    body: {
      fontSize: 16,
      fontWeight: "400" as const,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: "500" as const,
      lineHeight: 24,
    },
    bodySemibold: {
      fontSize: 16,
      fontWeight: "600" as const,
      lineHeight: 24,
    },

    // Caption styles
    caption: {
      fontSize: 14,
      fontWeight: "500" as const,
    },
    captionMedium: {
      fontSize: 15,
      fontWeight: "500" as const,
      lineHeight: 22,
    },

    // Button styles
    button: {
      fontSize: 16,
      fontWeight: "600" as const,
    },
    buttonLarge: {
      fontSize: 18,
      fontWeight: "700" as const,
    },
    buttonXLarge: {
      fontSize: 24,
      fontWeight: "600" as const,
    },

    // Title styles
    title: {
      fontSize: 20,
      fontWeight: "700" as const,
      lineHeight: 24,
    },
    titleLarge: {
      fontSize: 28,
      fontWeight: "700" as const,
    },
    titleXLarge: {
      fontSize: 32,
      fontWeight: "bold" as const,
      lineHeight: 32,
    },

    // Subtitle styles
    subtitle: {
      fontSize: 14,
      fontWeight: "500" as const,
    },
    subtitleMedium: {
      fontSize: 16,
      fontWeight: "500" as const,
    },
    subtitleSemibold: {
      fontSize: 20,
      fontWeight: "bold" as const,
    },

    // Timer and large display text
    timer: {
      fontSize: 48,
      fontWeight: "700" as const,
    },

    // Special text styles
    verse: {
      fontSize: 30,
      fontWeight: "500" as const,
      fontStyle: "italic" as const,
      lineHeight: 40,
      letterSpacing: 0.5,
      fontFamily: "Spectral_700Bold_Italic",
    },
    quote: {
      fontSize: 70,
      fontWeight: "200" as const,
      lineHeight: 70,
      fontFamily: "serif",
    },
    quoteText: {
      fontSize: 18,
      fontWeight: "600" as const,
      fontStyle: "italic" as const,
    },

    // Badge and small text
    badge: {
      fontSize: 13,
      fontWeight: "500" as const,
    },
    small: {
      fontSize: 11,
      fontWeight: "500" as const,
    },

    // Tab and navigation
    tab: {
      fontSize: 14,
      fontWeight: "600" as const,
    },

    // Stat display
    statValue: {
      fontSize: 20,
      fontWeight: "700" as const,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: "500" as const,
    },
  },
} as const;

// Type helpers for better TypeScript support
export type FontSize = keyof typeof Typography.fontSize;
export type FontWeight = keyof typeof Typography.fontWeight;
export type LineHeight = keyof typeof Typography.lineHeight;
export type TextStyle = keyof typeof Typography.styles;
