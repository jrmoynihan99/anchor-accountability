// components/onboarding/church-selection/EmptyChurchState.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";

export function EmptyChurchState() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <IconSymbol name="building.2" size={48} color={colors.textSecondary} />
      <ThemedText
        type="body"
        style={[styles.text, { color: colors.textSecondary }]}
      >
        No churches found
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  text: {
    marginTop: 12,
  },
});
