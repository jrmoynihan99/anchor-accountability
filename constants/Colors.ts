const tintColorLight = "#CBAD8D"; // Tan
const tintColorDark = "#F1EDE6"; // Cream

export const Colors = {
  light: {
    // --- Original ---
    text: "#3A2D28", // Dark Brown
    background: "#F1EDE6", // Cream
    tint: tintColorLight, // Tan
    icon: "#A48374", // Rosewood
    tabIconDefault: "#A48374",
    tabIconSelected: tintColorLight,

    // --- New ---
    cardBackground: "#E6DED7", // 2% darker than #EBE3DB

    border: "#D1C7BD", // Soft Taupe
    buttonBackground: "#CBAD8D", // Tan
    buttonText: "#3A2D28", // Dark Brown
    shadow: "rgba(0, 0, 0, 0.1)", // Soft shadow
  },

  dark: {
    // --- Original ---
    text: "#F1EDE6", // Cream
    background: "#3A2D28", // Dark Brown
    tint: tintColorDark, // Cream
    icon: "#D1C7BD", // Soft Taupe
    tabIconDefault: "#D1C7BD",
    tabIconSelected: tintColorDark,

    // --- New ---
    cardBackground: "#A48374", // Rosewood
    border: "#A48374", // Rosewood (doubled for stronger lines in dark)
    buttonBackground: "#A48374", // Rosewood
    buttonText: "#F1EDE6", // Cream
    shadow: "rgba(0, 0, 0, 0.5)", // Stronger shadow
  },
};
