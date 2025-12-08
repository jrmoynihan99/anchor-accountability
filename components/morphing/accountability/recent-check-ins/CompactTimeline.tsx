// components/morphing/accountability/recent-check-ins/CompactTimeline.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { getStatusColor, getStatusIcon } from "../accountabilityUtils";

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

interface CompactTimelineProps {
  checkIns: TimelineItem[];
  selectedDate: string | null;
  onSelectItem: (item: TimelineItem) => void;
}

export function CompactTimeline({
  checkIns,
  selectedDate,
  onSelectItem,
}: CompactTimelineProps) {
  const { colors } = useTheme();

  const isMissing = (item: TimelineItem): item is MissingCheckIn => {
    return "isMissing" in item && item.isMissing === true;
  };

  // Get day label (e.g., "Mon", "Tue", or "Today")
  const getDayLabel = (dateString: string, isToday: boolean): string => {
    if (isToday) return "Today";

    const date = new Date(dateString);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNames[date.getDay()];
  };

  return (
    <View style={styles.historyRow}>
      {checkIns.map((item, i) => {
        const missing = isMissing(item);
        const isSelected = selectedDate === item.date;
        // The rightmost item (last in array) is always today
        const isTodayItem = i === checkIns.length - 1;
        const dayLabel = getDayLabel(item.date, isTodayItem);

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
                    ? `${getStatusColor(item.status, colors)}30`
                    : colors.cardBackground,
                  borderWidth: 2,
                  borderColor: missing
                    ? isSelected
                      ? colors.textSecondary
                      : colors.textSecondary
                    : isSelected
                    ? getStatusColor(item.status, colors)
                    : "transparent",
                  borderStyle: missing ? "dashed" : "solid",
                  opacity: missing && !isSelected ? 0.5 : 1,
                },
                // Add extra styling for today
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
                  name={getStatusIcon(item.status)}
                  size={18}
                  color={getStatusColor(item.status, colors)}
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
