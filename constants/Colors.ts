export const Colors = {
  light: {
    // --- Text Colors ---
    text: "#3A2D28", // Dark Brown
    textSecondary: "#8D7963", // Secondary text
    textMuted: "rgba(58, 45, 40, 0.6)", // Muted text for placeholders, disabled states, etc.

    background: "#F1EDE6", // Cream
    tint: "#CBAD8D", // Tan
    icon: "#A48374", // Rosewood
    tabIconDefault: "#A48374",
    tabIconSelected: "#CBAD8D",

    // --- UI Elements ---
    cardBackground: "#E6DED7", // 2% darker than #EBE3DB
    border: "#D1C7BD", // Soft Taupe
    buttonBackground: "#CBAD8D", // Tan
    secondaryButtonBackground: "#3A2D28", // Dark Brown
    shadow: "#000", // Soft shadow

    // --- Navigation ---
    navBackground: "rgba(255, 255, 255, 0.1)",
    navBorder: "rgba(255, 255, 255, 0.2)",
    navActiveText: "#FFFFFF",

    // --- Status Colors ---
    success: "#4CAF50", // Green for checkmarks
    error: "#E57373", // Red for errors/slipped
    achievement: "#FFD700", // Gold for achievements

    // --- Specialty Colors ---
    fireColor: "#F47C1A", // Orange for streak flames
    iconCircleBackground: "#FFF3E0", // Light orange background
    iconCircleSecondaryBackground: "rgba(58, 45, 40, 0.1)",

    // --- Overlay & Modal Colors ---
    overlayBackground: "rgba(0, 0, 0, 0.4)",
    modalCardBackground: "rgba(255, 255, 255, 0.15)",
    modalCardBorder: "rgba(255, 255, 255, 0.2)",
    textInputBackground: "rgba(255, 255, 255, 0.6)",
    textInputBorder: "rgba(58, 45, 40, 0.1)",

    // --- Come Back Tomorrow Banner ---
    bannerBackground: "rgba(116, 116, 128, 0.08)",
    bannerBorder: "rgba(116, 116, 128, 0.12)",

    // --- Close Button ---
    closeButtonBackground: "rgba(0, 0, 0, 0.08)",
    closeButtonText: "#3A2D28",

    // --- Drag Indicator ---
    dragIndicator: "rgba(58, 45, 40, 0.3)",

    // --- White variations ---
    white: "#FFFFFF",
    whiteTranslucent: "rgba(255, 255, 255, 0.7)",
  },

  dark: {
    // --- Text Colors ---
    text: "#F1EDE6", // Cream
    textSecondary: "#D1C7BD", // Lighter secondary text for better contrast
    textMuted: "rgba(241, 237, 230, 0.6)", // Muted text for placeholders, disabled states, etc.

    background: "#3A2D28", // Dark Brown
    tint: "#CBAD8D", // Tan (keeping consistent accent)
    icon: "#D1C7BD", // Soft Taupe
    tabIconDefault: "#D1C7BD",
    tabIconSelected: "#CBAD8D",

    // --- UI Elements ---
    cardBackground: "#4A3D35", // Slightly lighter than background for cards
    border: "#5D4E43", // Lighter brown for borders
    buttonBackground: "#A48374", // Rosewood
    secondaryButtonBackground: "#F1EDE6", // Cream
    shadow: "#000", // Stronger shadow

    // --- Navigation ---
    navBackground: "rgba(255, 255, 255, 0.1)",
    navBorder: "rgba(255, 255, 255, 0.2)",
    navActiveText: "#FFFFFF",

    // --- Status Colors ---
    success: "#4CAF50", // Green for checkmarks
    error: "#E57373", // Red for errors/slipped
    achievement: "#FFD700", // Gold for achievements

    // --- Specialty Colors ---
    fireColor: "#F47C1A", // Orange for streak flames
    iconCircleBackground: "rgba(255, 243, 224, 0.2)", // Darker version of light orange
    iconCircleSecondaryBackground: "rgba(241, 237, 230, 0.15)", // Light cream with opacity

    // --- Overlay & Modal Colors ---
    overlayBackground: "rgba(0, 0, 0, 0.6)", // Darker overlay for better contrast
    modalCardBackground: "rgba(74, 61, 53, 0.8)", // Using cardBackground with opacity
    modalCardBorder: "rgba(93, 78, 67, 0.5)", // Using border color with opacity
    textInputBackground: "rgba(74, 61, 53, 0.8)", // Darker input background
    textInputBorder: "rgba(93, 78, 67, 0.3)", // Darker input border

    // --- Come Back Tomorrow Banner ---
    bannerBackground: "rgba(116, 116, 128, 0.15)", // Slightly more visible in dark
    bannerBorder: "rgba(116, 116, 128, 0.25)", // More visible border

    // --- Close Button ---
    closeButtonBackground: "rgba(241, 237, 230, 0.1)", // Light cream background
    closeButtonText: "#F1EDE6", // Light text

    // --- Drag Indicator ---
    dragIndicator: "rgba(241, 237, 230, 0.4)", // Light cream indicator

    // --- White variations ---
    white: "#FFFFFF",
    whiteTranslucent: "rgba(255, 255, 255, 0.1)", // Much more subtle in dark mode
  },
};
