// components/morphing/accountability/recent-check-ins/CheckInDropdown.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  formatDate,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
} from "../accountabilityUtils";

interface CheckInRecord {
  date: string;
  status: "great" | "struggling" | "support";
  note?: string;
}

interface MissingCheckIn {
  date: string;
  status: null;
  isMissing: true;
}

type TimelineItem = CheckInRecord | MissingCheckIn;

interface CheckInDropdownProps {
  selectedCheckIn: TimelineItem | null;
  onClose: () => void;
  showFillHint?: boolean; // Show "Use section above" hint (MentorModal only)
}

export function CheckInDropdown({
  selectedCheckIn,
  onClose,
  showFillHint = false,
}: CheckInDropdownProps) {
  const { colors } = useTheme();

  if (!selectedCheckIn) return null;

  const isMissing = (item: TimelineItem): item is MissingCheckIn => {
    return "isMissing" in item && item.isMissing === true;
  };

  const missing = isMissing(selectedCheckIn);

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
            name={
              missing
                ? "exclamationmark.circle"
                : getStatusIcon(selectedCheckIn.status)
            }
            size={20}
            color={
              missing
                ? colors.textSecondary
                : getStatusColor(selectedCheckIn.status, colors)
            }
            style={{ marginRight: 8 }}
          />
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            {missing ? "No Check-In" : getStatusLabel(selectedCheckIn.status)}
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
        {formatDate(selectedCheckIn.date)}
      </ThemedText>

      {missing ? (
        /* Missing Day Hint */
        <View
          style={[
            styles.hint,
            { backgroundColor: `${colors.textSecondary}15` },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            {showFillHint
              ? "Use the section above to add a check-in for this day"
              : "User did not check in on this day"}
          </ThemedText>
        </View>
      ) : (
        /* Check-In Note (if exists) */
        selectedCheckIn.note && (
          <View style={styles.note}>
            <ThemedText
              type="caption"
              style={{ color: colors.textSecondary, marginBottom: 4 }}
            >
              Note:
            </ThemedText>
            <ThemedText type="body" style={{ color: colors.text }}>
              {selectedCheckIn.note}
            </ThemedText>
          </View>
        )
      )}
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
  note: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  hint: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
});
