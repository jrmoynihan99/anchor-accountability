// components/onboarding/login/ChurchIndicator.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";

interface ChurchIndicatorProps {
  organizationName: string;
  isGuest: boolean;
}

export function ChurchIndicator({
  organizationName,
  isGuest,
}: ChurchIndicatorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isGuest
              ? colors.cardBackground
              : colors.iconCircleSecondaryBackground,
            borderColor: isGuest ? colors.border : colors.icon + "33",
          },
        ]}
      >
        <IconSymbol
          name={isGuest ? "person" : "building.2"}
          size={16}
          color={isGuest ? colors.textSecondary : colors.icon}
        />
        <View style={styles.textRow}>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {isGuest ? "Joining as " : "Joining "}
          </ThemedText>
          <ThemedText
            type="bodyMedium"
            style={[styles.organizationName, { color: colors.text }]}
          >
            {isGuest ? "Guest" : organizationName}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  organizationName: {
    fontWeight: "600",
  },
});
