// components/morphing/settings/sections/SettingsHeader.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

export function SettingsHeader() {
  const { colors } = useTheme();

  return (
    <View style={styles.headerSection}>
      <View
        style={[
          styles.headerIcon,
          { backgroundColor: colors.iconCircleSecondaryBackground },
        ]}
      >
        <Ionicons
          name="settings-sharp"
          size={32}
          color={colors.tabIconDefault}
        />
      </View>

      <ThemedText type="title" style={styles.headerTitle}>
        Settings
      </ThemedText>

      <ThemedText
        type="caption"
        lightColor={colors.textSecondary}
        darkColor={colors.textSecondary}
        style={styles.headerSubtitle}
      >
        Customize your app experience
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.8,
  },
});
