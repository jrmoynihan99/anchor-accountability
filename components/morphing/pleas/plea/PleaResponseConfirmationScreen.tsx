// components/messages/PleaResponseConfirmationScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";

export function PleaResponseConfirmationScreen() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${colors.iconCircleBackground}50` },
        ]}
      >
        <IconSymbol name="checkmark" size={36} color={colors.icon} />
      </View>
      <ThemedText
        type="title"
        style={[styles.text, { color: colors.text, marginTop: 20 }]}
      >
        Thank you for helping!
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.subtext, { color: colors.textSecondary, marginTop: 8 }]}
      >
        Your encouragement was sent anonymously.
      </ThemedText>
      {/* No close button, modal will auto-close */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor applied inline for theme!
  },
  text: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 22,
  },
  subtext: {
    textAlign: "center",
    opacity: 0.8,
    fontSize: 16,
    marginBottom: 20,
  },
});
