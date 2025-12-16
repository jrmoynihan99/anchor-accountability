// components/morphing/settings/sections/ConvertAccountButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface ConvertAccountButtonProps {
  onNavigateToConvertAccount: () => void;
}

export function ConvertAccountButton({
  onNavigateToConvertAccount,
}: ConvertAccountButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNavigateToConvertAccount();
  };

  return (
    <TouchableOpacity
      style={[
        styles.convertButton,
        { backgroundColor: colors.success || "#34C759" },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <IconSymbol name="person.badge.plus" size={20} color={colors.white} />
      <ThemedText
        type="bodyMedium"
        lightColor={colors.white}
        darkColor={colors.white}
      >
        Create Permanent Account
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  convertButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
});
