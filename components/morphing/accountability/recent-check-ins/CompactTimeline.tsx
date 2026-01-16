// components/morphing/accountability/recent-check-ins/CompactTimeline.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { TriggerType } from "@/hooks/accountability/useCheckIns";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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

interface CompactTimelineProps {
  checkIns: TimelineItem[];
  selectedDate: string | null;
  onSelectItem: (item: TimelineItem) => void;
  userTimezone?: string | null;
}

function getTemptationColor(level: number, colors: any): string {
  if (level <= 2) return colors.success || "#34C759";
  if (level <= 4) return colors.warning || "#FF9500";
  return colors.error || "#FF3B30";
}

function getTemptationIcon(level: number): string {
  if (level <= 2) return "checkmark.circle.fill";
  if (level <= 4) return "exclamationmark.circle.fill";
  return "xmark.circle.fill";
}

export function CompactTimeline({
  checkIns,
  selectedDate,
  onSelectItem,
  userTimezone,
}: CompactTimelineProps) {
  const { colors } = useTheme();

  const isMissing = (item: TimelineItem): item is MissingCheckIn => {
    return "isMissing" in item && item.isMissing === true;
  };

  // Get today's date string in the appropriate timezone
  const getTodayDateString = (): string => {
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

      return `${year}-${month}-${day}`;
    } else {
      // Use device local time
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  };

  const todayDateString = getTodayDateString();

  // Get day label (e.g., "Mon", "Tue", or "Today")
  const getDayLabel = (dateString: string): string => {
    if (dateString === todayDateString) return "Today";

    const date = new Date(dateString + "T00:00:00");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNames[date.getDay()];
  };

  return (
    <View style={styles.historyRow}>
      {checkIns.map((item, i) => {
        const missing = isMissing(item);
        const isSelected = selectedDate === item.date;
        const isTodayItem = item.date === todayDateString;
        const dayLabel = getDayLabel(item.date);

        return (
          <View key={i} style={styles.dotContainer}>
            <TouchableOpacity
              style={[
                styles.historyDot,
                {
                  backgroundColor: missing
                    ? isSelected
                      ? `${colors.textSecondary}30`
                      : colors.cardBackground
                    : isSelected
                    ? `${getTemptationColor(item.temptationLevel, colors)}30`
                    : colors.background,
                  borderWidth: 2,
                  borderColor: missing
                    ? isSelected
                      ? colors.textSecondary
                      : colors.textSecondary
                    : isSelected
                    ? getTemptationColor(item.temptationLevel, colors)
                    : colors.border,
                  borderStyle: missing ? "dashed" : "solid",
                  opacity: missing && !isSelected ? 0.5 : 1,
                },
                isTodayItem && styles.todayDot,
              ]}
              onPress={() => onSelectItem(item)}
            >
              {missing ? (
                <IconSymbol
                  name="xmark"
                  size={18}
                  color={colors.textSecondary}
                />
              ) : (
                <IconSymbol
                  name={getTemptationIcon(item.temptationLevel)}
                  size={18}
                  color={getTemptationColor(item.temptationLevel, colors)}
                />
              )}
            </TouchableOpacity>
            {isTodayItem ? (
              <View
                style={[
                  styles.todayLabelContainer,
                  { backgroundColor: colors.buttonBackground },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={[
                    styles.dayLabel,
                    {
                      color: colors.white,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {dayLabel}
                </ThemedText>
              </View>
            ) : (
              <ThemedText
                type="caption"
                style={[
                  styles.dayLabel,
                  {
                    color: colors.textSecondary,
                    fontWeight: "400",
                  },
                ]}
              >
                {dayLabel}
              </ThemedText>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 16,
  },
  dotContainer: {
    alignItems: "center",
    gap: 6,
  },
  historyDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  todayDot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  todayLabelContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 11,
  },
});
