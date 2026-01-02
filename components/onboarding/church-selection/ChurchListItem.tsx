// components/onboarding/church-selection/ChurchListItem.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface ChurchListItemProps {
  name: string;
  onPress: () => void;
}

export function ChurchListItem({ name, onPress }: ChurchListItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconSymbol name="building.2" size={24} color={colors.icon} />
      <ThemedText
        type="bodyMedium"
        style={[styles.text, { color: colors.text }]}
      >
        {name}
      </ThemedText>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  text: {
    flex: 1,
  },
});
