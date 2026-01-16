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
  isSelected?: boolean;
}

export function ChurchListItem({
  name,
  onPress,
  isSelected = false,
}: ChurchListItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={isSelected ? undefined : onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: isSelected
            ? colors.iconCircleSecondaryBackground
            : colors.cardBackground,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.icon : colors.border,
        },
      ]}
    >
      <IconSymbol
        name="building.2"
        size={24}
        color={isSelected ? colors.icon : colors.icon}
      />
      <ThemedText
        type="bodyMedium"
        style={[
          styles.text,
          {
            color: colors.text,
            fontWeight: isSelected ? "600" : "400",
          },
        ]}
      >
        {name}
      </ThemedText>
      {isSelected ? (
        <Ionicons name="checkmark-circle" size={24} color={colors.icon} />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      )}
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
