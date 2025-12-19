// components/morphing/settings/sections/PrivacySection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface PrivacySectionProps {
  onNavigateToContent?: (title: string, content: string) => void;
}

export function PrivacySection({ onNavigateToContent }: PrivacySectionProps) {
  const { colors } = useTheme();

  const handlePrivacyPress = () => {
    if (onNavigateToContent) {
      onNavigateToContent("Privacy Policy", "privacy");
    }
  };

  const handleTermsPress = () => {
    if (onNavigateToContent) {
      onNavigateToContent("Terms of Service", "terms");
    }
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <IconSymbol name="lock.shield" size={20} color={colors.textSecondary} />
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          Privacy & Security
        </ThemedText>
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPress}>
        <ThemedText type="body" style={styles.settingLabel}>
          Privacy Policy
        </ThemedText>
        <IconSymbol
          name="chevron.right"
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleTermsPress}>
        <ThemedText type="body" style={styles.settingLabel}>
          Terms of Service
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
});
