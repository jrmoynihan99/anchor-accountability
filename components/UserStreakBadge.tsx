// components/streaks/UserStreakBadge.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, View } from "react-native";

interface UserStreakBadgeProps {
  streak: number;
  size?: "small" | "medium"; // Different sizes for different contexts
  style?: any;
}

export function UserStreakBadge({
  streak,
  size = "small",
  style,
}: UserStreakBadgeProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  // Don't show badge if no streak
  if (streak <= 0) return null;

  const isSmall = size === "small";
  const iconSize = isSmall ? 12 : 16;
  const containerStyle = isSmall
    ? styles.containerSmall
    : styles.containerMedium;
  const textType = isSmall ? "caption" : "captionMedium";

  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor:
            colors.iconCircleBackground || `${colors.fireColor}20`,
          borderColor: colors.fireColor,
        },
        style,
      ]}
    >
      <IconSymbol name="flame.fill" size={iconSize} color={colors.fireColor} />
      <ThemedText
        type={textType}
        style={[
          styles.text,
          {
            color: colors.fireColor,
            fontSize: isSmall ? 11 : 12,
            fontWeight: "600",
          },
        ]}
      >
        {streak}d
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
    gap: 3,
  },
  containerMedium: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 4,
  },
  text: {
    lineHeight: 14,
  },
});
