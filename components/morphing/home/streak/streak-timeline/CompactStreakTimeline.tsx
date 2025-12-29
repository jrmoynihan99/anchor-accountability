// components/morphing/accountability/streak-timeline/CompactStreakTimeline.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { getLocalDateString } from "../streakUtils";

export interface StreakEntry {
  date: string; // YYYY-MM-DD format
  status: "success" | "fail" | "pending";
}

interface CompactStreakTimelineProps {
  streakData: StreakEntry[];
  selectedDate: string | null;
  onSelectDay: (entry: StreakEntry) => void;
}

function getStatusColor(status: StreakEntry["status"], colors: any): string {
  if (status === "success") return colors.success || "#34C759";
  if (status === "fail") return colors.error || "#FF3B30";
  return colors.textSecondary;
}

function getStatusIcon(status: StreakEntry["status"]): string {
  if (status === "success") return "checkmark.circle.fill";
  if (status === "fail") return "xmark.circle.fill";
  return "xmark"; // pending
}

export function CompactStreakTimeline({
  streakData,
  selectedDate,
  onSelectDay,
}: CompactStreakTimelineProps) {
  const { colors } = useTheme();

  // Get today's date string in local time
  const todayDateString = getLocalDateString(0);

  // Generate last 7 days (today and 6 days back)
  const last7Days: StreakEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const dateString = getLocalDateString(-i);
    const existing = streakData.find((e) => e.date === dateString);

    if (existing) {
      last7Days.push(existing);
    } else {
      // If no data exists for this date, create a pending entry
      last7Days.push({
        date: dateString,
        status: "pending",
      });
    }
  }

  // Get day label (e.g., "Mon", "Tue", or "Today")
  const getDayLabel = (dateString: string): string => {
    if (dateString === todayDateString) return "Today";

    const date = new Date(dateString + "T00:00:00");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNames[date.getDay()];
  };

  return (
    <View style={styles.historyRow}>
      {last7Days.map((entry, i) => {
        const isSelected = selectedDate === entry.date;
        const isTodayItem = entry.date === todayDateString;
        const dayLabel = getDayLabel(entry.date);
        const isPending = entry.status === "pending";

        return (
          <View key={i} style={styles.dotContainer}>
            <TouchableOpacity
              style={[
                styles.historyDot,
                {
                  backgroundColor: isPending
                    ? isSelected
                      ? `${colors.textSecondary}30`
                      : colors.cardBackground
                    : isSelected
                    ? `${getStatusColor(entry.status, colors)}30`
                    : colors.cardBackground,
                  borderWidth: 2,
                  borderColor: isPending
                    ? isSelected
                      ? colors.textSecondary
                      : colors.textSecondary
                    : isSelected
                    ? getStatusColor(entry.status, colors)
                    : "transparent",
                  borderStyle: isPending ? "dashed" : "solid",
                  opacity: isPending && !isSelected ? 0.5 : 1,
                },
                isTodayItem && styles.todayDot,
              ]}
              onPress={() => onSelectDay(entry)}
            >
              <IconSymbol
                name={getStatusIcon(entry.status)}
                size={18}
                color={
                  isPending
                    ? colors.textSecondary
                    : getStatusColor(entry.status, colors)
                }
              />
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
