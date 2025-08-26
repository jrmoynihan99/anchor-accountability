export const Colors = {
  // Original warm, earthy palette
  palette1: {
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
      messageInputBackground: "rgba(241, 237, 230, 0.1)", // Cream with same opacity as navBackground

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
      messageInputBackground: "rgba(58, 45, 40, 0.1)", // Dark Brown with same opacity as navBackground

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
  },

  // Cool, oceanic palette - blues and teals
  palette2: {
    light: {
      // --- Text Colors ---
      text: "#2C3E50", // Deep Blue-Gray
      textSecondary: "#5D6D7E", // Cool gray
      textMuted: "rgba(44, 62, 80, 0.6)",

      background: "#F8FAFB", // Very light blue-gray
      tint: "#3498DB", // Ocean blue
      icon: "#5DADE2", // Light blue
      tabIconDefault: "#5DADE2",
      tabIconSelected: "#3498DB",

      // --- UI Elements ---
      cardBackground: "#EBF5FB", // Very light blue
      border: "#D6EAF8", // Light blue border
      buttonBackground: "#3498DB", // Ocean blue
      secondaryButtonBackground: "#2C3E50", // Deep blue-gray
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(248, 250, 251, 0.1)",

      // --- Status Colors ---
      success: "#27AE60", // Green
      error: "#E74C3C", // Red
      achievement: "#F39C12", // Orange

      // --- Specialty Colors ---
      fireColor: "#E67E22", // Orange
      iconCircleBackground: "#EBF5FB", // Light blue background
      iconCircleSecondaryBackground: "rgba(44, 62, 80, 0.1)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.4)",
      modalCardBackground: "rgba(255, 255, 255, 0.15)",
      modalCardBorder: "rgba(255, 255, 255, 0.2)",
      textInputBackground: "rgba(255, 255, 255, 0.6)",
      textInputBorder: "rgba(44, 62, 80, 0.1)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.08)",
      bannerBorder: "rgba(116, 116, 128, 0.12)",

      // --- Close Button ---
      closeButtonBackground: "rgba(0, 0, 0, 0.08)",
      closeButtonText: "#2C3E50",

      // --- Drag Indicator ---
      dragIndicator: "rgba(44, 62, 80, 0.3)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.7)",
    },

    dark: {
      // --- Text Colors ---
      text: "#ECF0F1", // Light blue-white
      textSecondary: "#BDC3C7", // Light gray
      textMuted: "rgba(236, 240, 241, 0.6)",

      background: "#1C2833", // Dark blue-gray
      tint: "#5DADE2", // Light blue
      icon: "#AED6F1", // Very light blue
      tabIconDefault: "#AED6F1",
      tabIconSelected: "#5DADE2",

      // --- UI Elements ---
      cardBackground: "#273746", // Slightly lighter dark blue
      border: "#34495E", // Medium blue-gray
      buttonBackground: "#3498DB", // Ocean blue
      secondaryButtonBackground: "#ECF0F1", // Light blue-white
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(28, 40, 51, 0.1)",

      // --- Status Colors ---
      success: "#27AE60", // Green
      error: "#E74C3C", // Red
      achievement: "#F39C12", // Orange

      // --- Specialty Colors ---
      fireColor: "#E67E22", // Orange
      iconCircleBackground: "rgba(235, 245, 251, 0.2)",
      iconCircleSecondaryBackground: "rgba(236, 240, 241, 0.15)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.6)",
      modalCardBackground: "rgba(39, 55, 70, 0.8)",
      modalCardBorder: "rgba(52, 73, 94, 0.5)",
      textInputBackground: "rgba(39, 55, 70, 0.8)",
      textInputBorder: "rgba(52, 73, 94, 0.3)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.15)",
      bannerBorder: "rgba(116, 116, 128, 0.25)",

      // --- Close Button ---
      closeButtonBackground: "rgba(236, 240, 241, 0.1)",
      closeButtonText: "#ECF0F1",

      // --- Drag Indicator ---
      dragIndicator: "rgba(236, 240, 241, 0.4)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.1)",
    },
  },

  // Sophisticated purple and gray palette
  palette3: {
    light: {
      // --- Text Colors ---
      text: "#4A4A4A", // Charcoal gray
      textSecondary: "#7A7A7A", // Medium gray
      textMuted: "rgba(74, 74, 74, 0.6)",

      background: "#FAFAFA", // Very light gray
      tint: "#8E44AD", // Rich purple
      icon: "#BB8FCE", // Light purple
      tabIconDefault: "#BB8FCE",
      tabIconSelected: "#8E44AD",

      // --- UI Elements ---
      cardBackground: "#F4F4F4", // Light gray
      border: "#E8E8E8", // Very light gray border
      buttonBackground: "#8E44AD", // Rich purple
      secondaryButtonBackground: "#4A4A4A", // Charcoal gray
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(250, 250, 250, 0.1)",

      // --- Status Colors ---
      success: "#27AE60", // Green
      error: "#E74C3C", // Red
      achievement: "#F39C12", // Orange

      // --- Specialty Colors ---
      fireColor: "#E67E22", // Orange
      iconCircleBackground: "#F4F1F8", // Very light purple
      iconCircleSecondaryBackground: "rgba(74, 74, 74, 0.1)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.4)",
      modalCardBackground: "rgba(255, 255, 255, 0.15)",
      modalCardBorder: "rgba(255, 255, 255, 0.2)",
      textInputBackground: "rgba(255, 255, 255, 0.6)",
      textInputBorder: "rgba(74, 74, 74, 0.1)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.08)",
      bannerBorder: "rgba(116, 116, 128, 0.12)",

      // --- Close Button ---
      closeButtonBackground: "rgba(0, 0, 0, 0.08)",
      closeButtonText: "#4A4A4A",

      // --- Drag Indicator ---
      dragIndicator: "rgba(74, 74, 74, 0.3)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.7)",
    },

    dark: {
      // --- Text Colors ---
      text: "#F8F9FA", // Almost white
      textSecondary: "#D1D3D4", // Light gray
      textMuted: "rgba(248, 249, 250, 0.6)",

      background: "#2C2C2C", // Dark gray
      tint: "#BB8FCE", // Light purple
      icon: "#D7BDE2", // Very light purple
      tabIconDefault: "#D7BDE2",
      tabIconSelected: "#BB8FCE",

      // --- UI Elements ---
      cardBackground: "#3A3A3A", // Medium dark gray
      border: "#4A4A4A", // Charcoal gray
      buttonBackground: "#8E44AD", // Rich purple
      secondaryButtonBackground: "#F8F9FA", // Almost white
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(44, 44, 44, 0.1)",

      // --- Status Colors ---
      success: "#27AE60", // Green
      error: "#E74C3C", // Red
      achievement: "#F39C12", // Orange

      // --- Specialty Colors ---
      fireColor: "#E67E22", // Orange
      iconCircleBackground: "rgba(244, 241, 248, 0.2)",
      iconCircleSecondaryBackground: "rgba(248, 249, 250, 0.15)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.6)",
      modalCardBackground: "rgba(58, 58, 58, 0.8)",
      modalCardBorder: "rgba(74, 74, 74, 0.5)",
      textInputBackground: "rgba(58, 58, 58, 0.8)",
      textInputBorder: "rgba(74, 74, 74, 0.3)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.15)",
      bannerBorder: "rgba(116, 116, 128, 0.25)",

      // --- Close Button ---
      closeButtonBackground: "rgba(248, 249, 250, 0.1)",
      closeButtonText: "#F8F9FA",

      // --- Drag Indicator ---
      dragIndicator: "rgba(248, 249, 250, 0.4)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.1)",
    },
  },
};
