// app/update.tsx
import { StyleSheet, View, Platform, Text } from "react-native";

export default function UpdateScreen() {
  const isIOS = Platform.OS === "ios";

  const instructions = isIOS
    ? [
        "Open the App Store",
        "Tap your profile picture (top right)",
        "Scroll to find Anchor",
        "Tap \"Update\"",
      ]
    : [
        "Open the Google Play Store",
        "Tap your profile picture (top right)",
        "Tap \"Manage apps & device\"",
        "Find Anchor and tap \"Update\"",
      ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Update Required</Text>

        {/* Message */}
        <Text style={styles.message}>
          A new version of Anchor is available. Please update to continue using
          the app.
        </Text>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to update:</Text>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FAF8F6", // Light background
  },
  content: {
    maxWidth: 400,
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontFamily: "Spectral_700Bold",
    color: "#3D3022", // Dark text
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontFamily: "Spectral_400Regular",
    color: "#6B5F52", // Secondary text
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  instructionsContainer: {
    backgroundColor: "#E6DED7", // Card background
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: "Spectral_700Bold",
    color: "#3D3022", // Dark text
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepNumber: {
    fontSize: 16,
    fontFamily: "Spectral_700Bold",
    color: "#CBAD8D", // Tint color
    marginRight: 8,
    minWidth: 24,
  },
  instructionText: {
    fontSize: 16,
    fontFamily: "Spectral_400Regular",
    color: "#3D3022", // Dark text
    flex: 1,
    lineHeight: 24,
  },
});
