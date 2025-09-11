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
      tint: "#A48374", // Tan (keeping consistent accent)
      icon: "#D1C7BD", // Soft Taupe
      tabIconDefault: "#D1C7BD",
      tabIconSelected: "#A48374",

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
      textInputBackground: "rgba(0, 0, 0, 0.2)", // Darker input background
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

  palette2: {
    light: {
      // --- Text Colors ---
      text: "#24394D", // Midpoint between original #2C3E50 and deep #1B2631
      textSecondary: "#516B7A", // Between #5D6D7E and #34495E
      textMuted: "rgba(36, 57, 77, 0.6)",

      background: "#F6F9FB", // Between original #F8FAFB and deeper #F4F6F8
      tint: "#2E86C1", // Between original #3498DB and deep #2471A3
      icon: "#4699D3", // Between original #5DADE2 and deep #3498DB
      tabIconDefault: "#4699D3",
      tabIconSelected: "#2E86C1",

      // --- UI Elements ---
      cardBackground: "#E9F4F9", // Between original #EBF5FB and deep #E8F4FD
      border: "#D0E4F0", // Between original #D6EAF8 and deep #AED6F1
      buttonBackground: "#2E86C1", // Midpoint blue
      secondaryButtonBackground: "#24394D", // Midpoint navy
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(246, 249, 251, 0.1)",

      // --- Status Colors ---
      success: "#28B463", // Between original #27AE60 and deep #229954
      error: "#CD3C2E", // Between original #E74C3C and deep #C0392B
      achievement: "#FFD700", // Keep original as it was good

      // --- Specialty Colors ---
      fireColor: "#E67E22", // Keep original
      iconCircleBackground: "#E9F4F9", // Match cardBackground
      iconCircleSecondaryBackground: "rgba(36, 57, 77, 0.1)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.4)",
      modalCardBackground: "rgba(255, 255, 255, 0.15)",
      modalCardBorder: "rgba(255, 255, 255, 0.2)",
      textInputBackground: "rgba(255, 255, 255, 0.6)",
      textInputBorder: "rgba(36, 57, 77, 0.1)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.08)",
      bannerBorder: "rgba(116, 116, 128, 0.12)",

      // --- Close Button ---
      closeButtonBackground: "rgba(0, 0, 0, 0.08)",
      closeButtonText: "#24394D",

      // --- Drag Indicator ---
      dragIndicator: "rgba(36, 57, 77, 0.3)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.7)",
    },

    dark: {
      // --- Text Colors ---
      text: "#EAF3F8", // Between original #ECF0F1 and deep #E8F4FD
      textSecondary: "#C4D3DC", // Between original #BDC3C7 and deep #AED6F1
      textMuted: "rgba(234, 243, 248, 0.6)",

      background: "#1f2f3eff", // Between original #1C2833 and deep #0B1426
      tint: "#4699D3", // Midpoint blue
      icon: "#96C9E6", // Between original #AED6F1 and deep #85C1E9
      tabIconDefault: "#96C9E6",
      tabIconSelected: "#4699D3",

      // --- UI Elements ---
      cardBackground: "#253340", // Between original #273746 and deep #1B2631
      border: "#414f5cff", // Between original #34495E and deep #2471A3
      buttonBackground: "#2E86C1", // Midpoint blue
      secondaryButtonBackground: "#EAF3F8", // Light text color
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(31, 47, 62, 0.1)",

      // --- Status Colors ---
      success: "#28B463", // Midpoint green
      error: "#CD3C2E", // Midpoint red
      achievement: "#FFD700", // Keep original

      // --- Specialty Colors ---
      fireColor: "#E67E22", // Keep original
      iconCircleBackground: "rgba(234, 243, 248, 0.15)",
      iconCircleSecondaryBackground: "rgba(234, 243, 248, 0.1)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.5)",
      modalCardBackground: "rgba(37, 51, 64, 0.85)",
      modalCardBorder: "rgba(65, 79, 92, 0.5)",
      textInputBackground: "rgba(0, 0, 0, 0.25)",
      textInputBorder: "rgba(45, 58, 46, 0.1)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.15)",
      bannerBorder: "rgba(116, 116, 128, 0.25)",

      // --- Close Button ---
      closeButtonBackground: "rgba(234, 243, 248, 0.1)",
      closeButtonText: "#EAF3F8",

      // --- Drag Indicator ---
      dragIndicator: "rgba(234, 243, 248, 0.35)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.1)",
    },
  },

  // Forest & Sage palette
  palette3: {
    light: {
      // --- Text Colors ---
      text: "#2D3A2E", // Deep forest green
      textSecondary: "#6B7A6F", // Muted sage
      textMuted: "rgba(45, 58, 46, 0.6)",

      background: "#F7F9F7", // Very light sage
      tint: "#7A9471", // Sage green
      icon: "#A8B8A2", // Light sage
      tabIconDefault: "#A8B8A2",
      tabIconSelected: "#7A9471",

      // --- UI Elements ---
      cardBackground: "#EDF2ED", // Light sage background
      border: "#DDE5DD", // Soft sage border
      buttonBackground: "#7A9471", // Sage green
      secondaryButtonBackground: "#2D3A2E", // Deep forest green
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(247, 249, 247, 0.1)",

      // --- Status Colors ---
      success: "#4CAF50", // Green
      error: "#E57373", // Red
      achievement: "#FFD700", // Gold

      // --- Specialty Colors ---
      fireColor: "#F47C1A", // Orange
      iconCircleBackground: "#E8F0E8", // Very light sage
      iconCircleSecondaryBackground: "rgba(45, 58, 46, 0.1)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.4)",
      modalCardBackground: "rgba(255, 255, 255, 0.15)",
      modalCardBorder: "rgba(255, 255, 255, 0.2)",
      textInputBackground: "rgba(255, 255, 255, 0.6)",
      textInputBorder: "rgba(45, 58, 46, 0.1)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.08)",
      bannerBorder: "rgba(116, 116, 128, 0.12)",

      // --- Close Button ---
      closeButtonBackground: "rgba(0, 0, 0, 0.08)",
      closeButtonText: "#2D3A2E",

      // --- Drag Indicator ---
      dragIndicator: "rgba(45, 58, 46, 0.3)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.7)",
    },

    dark: {
      // --- Text Colors ---
      text: "#E8F0E8", // Light sage white
      textSecondary: "#C1CFC1", // Light sage gray
      textMuted: "rgba(232, 240, 232, 0.6)",

      background: "#1F2B20", // Dark forest
      tint: "#A8B8A2", // Light sage
      icon: "#CBD5C9", // Very light sage
      tabIconDefault: "#CBD5C9",
      tabIconSelected: "#A8B8A2",

      // --- UI Elements ---
      cardBackground: "#2A3A2B", // Medium forest
      border: "#374A39", // Lighter forest
      buttonBackground: "#7A9471", // Sage green
      secondaryButtonBackground: "#E8F0E8", // Light sage white
      shadow: "#000",

      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(31, 43, 32, 0.1)",

      // --- Status Colors ---
      success: "#4CAF50", // Green
      error: "#E57373", // Red
      achievement: "#FFD700", // Gold

      // --- Specialty Colors ---
      fireColor: "#F47C1A", // Orange
      iconCircleBackground: "rgba(232, 240, 232, 0.2)",
      iconCircleSecondaryBackground: "rgba(232, 240, 232, 0.15)",

      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.6)",
      modalCardBackground: "rgba(42, 58, 43, 0.8)",
      modalCardBorder: "rgba(55, 74, 57, 0.5)",
      textInputBackground: "rgba(0, 0, 0, 0.2)",
      textInputBorder: "rgba(55, 74, 57, 0.3)",

      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.15)",
      bannerBorder: "rgba(116, 116, 128, 0.25)",

      // --- Close Button ---
      closeButtonBackground: "rgba(232, 240, 232, 0.1)",
      closeButtonText: "#E8F0E8",

      // --- Drag Indicator ---
      dragIndicator: "rgba(232, 240, 232, 0.4)",

      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.1)",
    },
  },

  // Navy & Bronze palette
  palette4: {
    light: {
      // --- Text Colors ---
      text: "#1E293B", // Dark navy
      textSecondary: "#64748B", // Slate gray
      textMuted: "rgba(30, 41, 59, 0.6)",
      background: "#F1F5F9", // Navy tinted light background
      tint: "#C2730C", // Brighter bronze
      icon: "#D4921E", // Lighter bronze
      tabIconDefault: "#D4921E",
      tabIconSelected: "#C2730C",
      // --- UI Elements ---
      cardBackground: "#E2E8F0", // Light navy tinted cards
      border: "#CBD5E1", // Navy tinted border
      buttonBackground: "#C2730C", // Brighter bronze
      secondaryButtonBackground: "#1E293B", // Dark navy
      shadow: "#000",
      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(241, 245, 249, 0.1)",
      // --- Status Colors ---
      success: "#4CAF50", // Green
      error: "#E57373", // Red
      achievement: "#FFD700", // Gold
      // --- Specialty Colors ---
      fireColor: "#F47C1A", // Orange
      iconCircleBackground: "#F8F9FC", // Very light navy tint
      iconCircleSecondaryBackground: "rgba(30, 41, 59, 0.1)",
      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.4)",
      modalCardBackground: "rgba(255, 255, 255, 0.15)",
      modalCardBorder: "rgba(255, 255, 255, 0.2)",
      textInputBackground: "rgba(255, 255, 255, 0.6)",
      textInputBorder: "rgba(30, 41, 59, 0.1)",
      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.08)",
      bannerBorder: "rgba(116, 116, 128, 0.12)",
      // --- Close Button ---
      closeButtonBackground: "rgba(0, 0, 0, 0.08)",
      closeButtonText: "#1E293B",
      // --- Drag Indicator ---
      dragIndicator: "rgba(30, 41, 59, 0.3)",
      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.7)",
    },
    dark: {
      // --- Text Colors ---
      text: "#F1F5F9", // Light slate
      textSecondary: "#CBD5E1", // Light slate gray
      textMuted: "rgba(241, 245, 249, 0.6)",
      background: "#0F1419", // Deep navy background
      tint: "#D97706", // Lighter bronze
      icon: "#E5A663", // Light bronze
      tabIconDefault: "#E5A663",
      tabIconSelected: "#D97706",
      // --- UI Elements ---
      cardBackground: "#1E2A3A", // Navy tinted cards
      border: "#334454", // Navy border
      buttonBackground: "#D97706", // Brighter bronze for dark mode
      secondaryButtonBackground: "#F1F5F9", // Light slate
      shadow: "#000",
      // --- Navigation ---
      navBackground: "rgba(255, 255, 255, 0.1)",
      navBorder: "rgba(255, 255, 255, 0.2)",
      navActiveText: "#FFFFFF",
      messageInputBackground: "rgba(15, 20, 25, 0.1)",
      // --- Status Colors ---
      success: "#4CAF50", // Green
      error: "#E57373", // Red
      achievement: "#FFD700", // Gold
      // --- Specialty Colors ---
      fireColor: "#F47C1A", // Orange
      iconCircleBackground: "rgba(241, 245, 249, 0.2)",
      iconCircleSecondaryBackground: "rgba(241, 245, 249, 0.15)",
      // --- Overlay & Modal Colors ---
      overlayBackground: "rgba(0, 0, 0, 0.6)",
      modalCardBackground: "rgba(30, 42, 58, 0.8)",
      modalCardBorder: "rgba(51, 68, 84, 0.5)",
      textInputBackground: "rgba(0, 0, 0, 0.2)",
      textInputBorder: "rgba(51, 68, 84, 0.3)",
      // --- Come Back Tomorrow Banner ---
      bannerBackground: "rgba(116, 116, 128, 0.15)",
      bannerBorder: "rgba(116, 116, 128, 0.25)",
      // --- Close Button ---
      closeButtonBackground: "rgba(241, 245, 249, 0.1)",
      closeButtonText: "#F1F5F9",
      // --- Drag Indicator ---
      dragIndicator: "rgba(241, 245, 249, 0.4)",
      // --- White variations ---
      white: "#FFFFFF",
      whiteTranslucent: "rgba(255, 255, 255, 0.1)",
    },
  },
};
