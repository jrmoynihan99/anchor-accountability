// components/morphing/accountability/recent-check-ins/CheckInDropdown.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { TriggerType } from "@/hooks/useCheckIns";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { formatDate } from "../accountabilityUtils";

interface CheckInRecord {
  date: string;
  temptationLevel: number;
  triggers?: TriggerType[];
  note?: string;
}

interface MissingCheckIn {
  date: string;
  temptationLevel: null;
  isMissing: true;
}

type TimelineItem = CheckInRecord | MissingCheckIn;

interface CheckInDropdownProps {
  selectedCheckIn: TimelineItem | null;
  onClose: () => void;
  showFillHint?: boolean; // Show "Use section above" hint (MentorModal only)
  userTimezone?: string; // Timezone of the user whose check-ins are being displayed
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  social_media: "Social Media",
  loneliness: "Loneliness",
  stress: "Stress",
  boredom: "Boredom",
  alcohol: "Alcohol",
  attraction: "Attraction",
  other: "Other",
};

function getTemptationColor(level: number, colors: any): string {
  if (level <= 2) return colors.success || "#34C759";
  if (level <= 4) return colors.warning || "#FF9500";
  return colors.error || "#FF3B30";
}

function getTemptationLabel(level: number): string {
  if (level <= 2) return "Clean & Strong";
  if (level <= 4) return "Clean but Struggled";
  return "Relapsed";
}

function getTemptationIcon(level: number): string {
  if (level <= 2) return "checkmark.circle.fill";
  if (level <= 4) return "exclamationmark.circle.fill";
  return "xmark.circle.fill";
}

export function CheckInDropdown({
  selectedCheckIn,
  onClose,
  showFillHint = false,
  userTimezone,
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
                : getTemptationIcon(selectedCheckIn.temptationLevel)
            }
            size={20}
            color={
              missing
                ? colors.textSecondary
                : getTemptationColor(selectedCheckIn.temptationLevel, colors)
            }
            style={{ marginRight: 8 }}
          />
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            {missing
              ? "No Check-In"
              : getTemptationLabel(selectedCheckIn.temptationLevel)}
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
        {formatDate(selectedCheckIn.date, userTimezone)}
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
        <>
          {/* Temptation Level - Visual Dots */}
          <View style={styles.levelContainer}>
            <ThemedText
              type="caption"
              style={{
                color: colors.textSecondary,
                marginBottom: 6,
              }}
            >
              Temptation Level
            </ThemedText>
            <View style={styles.dotsRow}>
              {[1, 2, 3, 4, 5].map((dotIndex) => (
                <View
                  key={dotIndex}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        dotIndex <= selectedCheckIn.temptationLevel
                          ? getTemptationColor(
                              selectedCheckIn.temptationLevel,
                              colors
                            )
                          : `${colors.textSecondary}30`,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Triggers (if they exist) */}
          {selectedCheckIn.triggers && selectedCheckIn.triggers.length > 0 && (
            <View style={styles.triggersSection}>
              <ThemedText
                type="caption"
                style={{
                  color: colors.textSecondary,
                  marginBottom: 6,
                }}
              >
                Triggers:
              </ThemedText>
              <View style={styles.triggersRow}>
                {selectedCheckIn.triggers.map((trigger, index) => (
                  <View
                    key={index}
                    style={[
                      styles.triggerChip,
                      {
                        backgroundColor: `${colors.textSecondary}20`,
                      },
                    ]}
                  >
                    <ThemedText type="caption" style={{ color: colors.text }}>
                      {TRIGGER_LABELS[trigger]}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Check-In Note (if exists) */}
          {selectedCheckIn.note && (
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
          )}
        </>
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
  levelContainer: {
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  triggersSection: {
    marginTop: 12,
  },
  triggersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  triggerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
