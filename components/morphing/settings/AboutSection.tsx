// components/morphing/settings/sections/AboutSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export function AboutSection() {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <IconSymbol name="info.circle" size={20} color={colors.textSecondary} />
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          About
        </ThemedText>
      </View>

      <TouchableOpacity style={styles.settingItem}>
        <ThemedText type="body" style={styles.settingLabel}>
          App Version
        </ThemedText>
        <ThemedText
          type="caption"
          lightColor={colors.textSecondary}
          darkColor={colors.textSecondary}
          style={styles.settingValue}
        >
          1.0.0
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <ThemedText type="body" style={styles.settingLabel}>
          Help & Support
        </ThemedText>
        <IconSymbol
          name="chevron.right"
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  settingLabel: {
    flex: 1,
  },
  settingValue: {
    opacity: 0.8,
  },
});
