// components/morphing/settings/sections/SignOutButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface SignOutButtonProps {
  onPress?: () => void;
}

export function SignOutButton({ onPress }: SignOutButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.signOutButton,
        { backgroundColor: colors.error || colors.tint },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <IconSymbol name="arrow.right.square" size={20} color={colors.white} />
      <ThemedText
        type="bodyMedium"
        lightColor={colors.white}
        darkColor={colors.white}
      >
        Sign Out
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
});
