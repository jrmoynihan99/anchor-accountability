// components/morphing/settings/ChurchInfoSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentOrganization } from "@/hooks/onboarding/useCurrentOrganization";
import React from "react";
import { StyleSheet, View } from "react-native";

export function ChurchInfoSection() {
  const { colors } = useTheme();
  const { organization, loading } = useCurrentOrganization();

  // Don't render if loading or no organization (public user)
  if (loading || !organization) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleSecondaryBackground },
          ]}
        >
          <IconSymbol
            name="building.2"
            size={20}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            {organization.name}
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Your Community
          </ThemedText>
        </View>
      </View>

      {organization.mission && (
        <View style={styles.missionContainer}>
          <ThemedText
            type="caption"
            style={[styles.missionLabel, { color: colors.textSecondary }]}
          >
            Mission
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.missionText, { color: colors.text }]}
          >
            {organization.mission}
          </ThemedText>
        </View>
      )}

      <View
        style={[
          styles.infoBox,
          { backgroundColor: colors.iconCircleSecondaryBackground },
        ]}
      >
        <ThemedText
          type="caption"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          All interactions are with members of {organization.name}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    opacity: 0.8,
  },
  missionContainer: {
    gap: 6,
  },
  missionLabel: {
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  missionText: {
    lineHeight: 20,
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    textAlign: "center",
    opacity: 0.8,
  },
});
