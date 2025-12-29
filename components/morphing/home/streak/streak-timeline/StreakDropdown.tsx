// components/morphing/accountability/streak-timeline/StreakDropdown.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { formatDateWithWeekday } from "../streakUtils";

export interface StreakEntry {
  date: string; // YYYY-MM-DD format
  status: "success" | "fail" | "pending";
}

interface StreakDropdownProps {
  selectedEntry: StreakEntry | null;
  onClose: () => void;
}

function getStatusColor(status: StreakEntry["status"], colors: any): string {
  if (status === "success") return colors.success || "#34C759";
  if (status === "fail") return colors.error || "#FF3B30";
  return colors.textSecondary;
}

function getStatusLabel(status: StreakEntry["status"]): string {
  if (status === "success") return "Porn Free";
  if (status === "fail") return "Slipped";
  return "In Progress";
}

function getStatusIcon(status: StreakEntry["status"]): string {
  if (status === "success") return "checkmark.circle.fill";
  if (status === "fail") return "xmark.circle.fill";
  return "clock";
}

export function StreakDropdown({
  selectedEntry,
  onClose,
}: StreakDropdownProps) {
  const { colors } = useTheme();

  if (!selectedEntry) return null;

  return (
    <View
      style={[
        styles.dropdown,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconSymbol
            name={getStatusIcon(selectedEntry.status)}
            size={20}
            color={getStatusColor(selectedEntry.status, colors)}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            {getStatusLabel(selectedEntry.status)}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={onClose}>
          <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ThemedText
        type="caption"
        style={{ color: colors.textSecondary, marginTop: 4 }}
      >
        {formatDateWithWeekday(selectedEntry.date)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
