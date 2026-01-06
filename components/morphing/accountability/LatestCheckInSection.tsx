import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { TriggerType } from "@/hooks/accountability/useCheckIns";
import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { formatCheckInTime } from "./accountabilityUtils";

interface CheckInRecord {
  date: string;
  temptationLevel: number;
  triggers?: TriggerType[];
  note?: string;
}

interface LatestCheckInSectionProps {
  latestCheckIn?: CheckInRecord;
  onMessage: () => void;
  userTimezone?: string | null;
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

export function LatestCheckInSection({
  latestCheckIn,
  onMessage,
  userTimezone,
}: LatestCheckInSectionProps) {
  const { colors } = useTheme();

  // Calculate check-in status from the actual latest check-in (real-time!)
  const checkInStatus = useMemo(() => {
    if (!latestCheckIn) {
      return {
        hasCheckedInToday: false,
        isOverdue: false,
        overdueText: null,
        statusText: "Waiting for check-in",
      };
    }

    // Get today's date in the user's timezone
    let todayString: string;
    if (userTimezone) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: userTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.formatToParts(new Date());
      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      todayString = `${year}-${month}-${day}`;
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      todayString = `${year}-${month}-${day}`;
    }

    const isToday = latestCheckIn.date === todayString;

    if (isToday) {
      return {
        hasCheckedInToday: true,
        isOverdue: false,
        overdueText: null,
        statusText: "Checked in today",
      };
    }

    // Calculate days since last check-in
    const lastDate = new Date(latestCheckIn.date);
    const today = new Date(todayString);
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // If last check-in was yesterday (1 day ago), that's fine - not overdue
    if (diffDays === 1) {
      return {
        hasCheckedInToday: false,
        isOverdue: false,
        overdueText: null,
        statusText: "Last check-in yesterday",
      };
    }

    // If 2+ days ago, then yesterday was missed - NOW it's overdue
    return {
      hasCheckedInToday: false,
      isOverdue: true,
      overdueText: diffDays === 2 ? "1d overdue" : `${diffDays - 1}d overdue`,
      statusText:
        diffDays === 2 ? "Overdue (1d)" : `Overdue (${diffDays - 1}d)`,
    };
  }, [latestCheckIn, userTimezone]);

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
        },
      ]}
    >
      {/* Section Header with Icon */}
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIconCircle,
            { backgroundColor: `${colors.iconCircleBackground}50` },
          ]}
        >
          <IconSymbol name="checkmark.circle" size={16} color={colors.icon} />
        </View>
        <View style={styles.sectionHeaderText}>
          <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
            Latest Check-In
          </ThemedText>
          <ThemedText
            type="caption"
            style={{
              color: checkInStatus.isOverdue
                ? colors.error
                : colors.textSecondary,
            }}
          >
            {checkInStatus.statusText}
          </ThemedText>
        </View>
      </View>

      {checkInStatus.hasCheckedInToday && latestCheckIn ? (
        /* They've Checked In */
        <View style={styles.latestCheckInContainer}>
          <View style={styles.statusBadge}>
            <IconSymbol
              name={getTemptationIcon(latestCheckIn.temptationLevel)}
              size={32}
              color={getTemptationColor(latestCheckIn.temptationLevel, colors)}
            />
          </View>
          <ThemedText
            type="subtitleMedium"
            style={{
              color: colors.text,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            {getTemptationLabel(latestCheckIn.temptationLevel)}
          </ThemedText>
          <ThemedText
            type="body"
            style={{
              color: getTemptationColor(latestCheckIn.temptationLevel, colors),
              textAlign: "center",
              marginTop: 4,
              fontWeight: "600",
            }}
          >
            Level {latestCheckIn.temptationLevel}/5
          </ThemedText>

          {/* Show triggers if they exist */}
          {latestCheckIn.triggers && latestCheckIn.triggers.length > 0 && (
            <View style={styles.triggersContainer}>
              <ThemedText
                type="caption"
                style={{
                  color: colors.textSecondary,
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                Triggers:
              </ThemedText>
              <View style={styles.triggersRow}>
                {latestCheckIn.triggers.map((trigger, index) => (
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

          {latestCheckIn.note && (
            <View
              style={[
                styles.noteContainer,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <ThemedText
                type="body"
                style={{ color: colors.text, fontStyle: "italic" }}
              >
                "{latestCheckIn.note}"
              </ThemedText>
            </View>
          )}
          <ThemedText
            type="caption"
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {formatCheckInTime(latestCheckIn.date)}
          </ThemedText>
        </View>
      ) : (
        /* Haven't Checked In Yet */
        <View style={styles.notCheckedInContainer}>
          <View
            style={[
              styles.notCheckedInBadge,
              {
                backgroundColor: checkInStatus.isOverdue
                  ? `${colors.error}20`
                  : `${colors.textSecondary}20`,
              },
            ]}
          >
            <IconSymbol
              name={
                checkInStatus.isOverdue
                  ? "exclamationmark.circle.fill"
                  : "clock.fill"
              }
              size={48}
              color={
                checkInStatus.isOverdue ? colors.error : colors.textSecondary
              }
            />
          </View>
          <ThemedText
            type="subtitleMedium"
            style={{ color: colors.text, textAlign: "center" }}
          >
            No check-in yet today
          </ThemedText>
          {checkInStatus.isOverdue && checkInStatus.overdueText && (
            <View
              style={[
                styles.overdueTag,
                { backgroundColor: `${colors.error}20` },
              ]}
            >
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={14}
                color={colors.error}
                style={{ marginRight: 4 }}
              />
              <ThemedText
                type="caption"
                style={{ color: colors.error, fontWeight: "600" }}
              >
                {checkInStatus.overdueText}
              </ThemedText>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.messageButton,
              {
                backgroundColor: `${colors.buttonBackground}30`,
                borderWidth: 1,
                borderColor: colors.buttonBackground,
                marginTop: 16,
              },
            ]}
            onPress={onMessage}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="message.fill"
              color={colors.buttonBackground}
              size={18}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              type="button"
              style={{ color: colors.buttonBackground }}
            >
              Message Partner
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  latestCheckInContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statusBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  triggersContainer: {
    marginTop: 16,
    width: "100%",
  },
  triggersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  triggerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  notCheckedInContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  notCheckedInBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  overdueTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
});
