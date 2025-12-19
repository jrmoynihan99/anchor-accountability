// components/morphing/settings/BlockListSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface BlockListSectionProps {
  onNavigateToBlockList?: () => void;
}

export function BlockListSection({
  onNavigateToBlockList,
}: BlockListSectionProps) {
  const { colors } = useTheme();
  const { blockedUserIds, loading } = useBlockedUsers();

  const blockedCount = blockedUserIds.size;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <IconSymbol
          name="hand.raised.slash"
          size={20}
          color={colors.textSecondary}
        />
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          Blocked Users
        </ThemedText>
      </View>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={onNavigateToBlockList}
        disabled={loading}
      >
        <View style={styles.settingLabelContainer}>
          <ThemedText type="body" style={styles.settingLabel}>
            Block List
          </ThemedText>
          {!loading && blockedCount > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.error || colors.tint },
              ]}
            >
              <ThemedText
                type="caption"
                style={[styles.badgeText, { color: colors.white }]}
              >
                {blockedCount}
              </ThemedText>
            </View>
          )}
        </View>
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
  settingLabelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingLabel: {
    flex: 0,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
