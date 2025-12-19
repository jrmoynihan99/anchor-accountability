// components/morphing/accountability/recent-check-ins/ExpandedCalendar.tsx

import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { getStatusColor, getStatusIcon } from "../accountabilityUtils";
import { generateCalendar, isDateInFuture } from "./calendarUtils";
import { MonthNavigation } from "./MonthNavigation";

// ----------------- Types -----------------

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

interface ExpandedCalendarProps {
  currentMonth: Date;
  checkIns: TimelineItem[];
  selectedDate: string | null;
  onSelectDate: (dateString: string, isMissing: boolean) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onLayout?: (event: any) => void;
  userTimezone?: string; // Timezone of the user whose check-ins are being displayed
}

type MonthCell =
  | { empty: true }
  | {
      empty: false;
      dateString: string;
      checkIn: TimelineItem | null;
      dayNumber: number;
      isMissingDay: boolean;
      isFuture: boolean;
    };

// ----------------- Component -----------------

function ExpandedCalendarComponent({
  currentMonth,
  checkIns,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onLayout,
  userTimezone,
}: ExpandedCalendarProps) {
  const { colors } = useTheme();

  // O(1) lookup table for check-ins by date
  const checkInMap = useMemo<Record<string, TimelineItem>>(() => {
    const map: Record<string, TimelineItem> = {};
    for (const ci of checkIns) {
      map[ci.date] = ci;
    }
    return map;
  }, [checkIns]);

  // Precompute all data needed to render the month grid
  const monthData: MonthCell[] = useMemo(() => {
    const dates = generateCalendar(currentMonth);

    return dates.map<MonthCell>((d) => {
      if (d === null) {
        return { empty: true };
      }

      const dateString = d; // now guaranteed string
      const checkIn = checkInMap[dateString] ?? null;

      const dayNumber = Number(dateString.slice(8, 10));
      const isMissingDay =
        !checkIn || ("isMissing" in checkIn && checkIn.isMissing === true);
      const isFuture = isDateInFuture(dateString, userTimezone);

      return {
        empty: false,
        dateString,
        checkIn,
        dayNumber,
        isMissingDay,
        isFuture,
      };
    });
  }, [currentMonth, checkInMap, userTimezone]);

  return (
    <View onLayout={onLayout}>
      {/* Header with month + arrows */}
      <MonthNavigation
        currentMonth={currentMonth}
        onPrevious={onPreviousMonth}
        onNext={onNextMonth}
      />

      {/* Day-of-week labels */}
      <View style={styles.dayLabels}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <ThemedText
            key={i}
            type="caption"
            style={[styles.dayLabel, { color: colors.textSecondary }]}
          >
            {day}
          </ThemedText>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {monthData.map((cell, i) => {
          if (cell.empty) {
            return <View key={`empty-${i}`} style={styles.calendarDay} />;
          }

          const { dateString, dayNumber, checkIn, isMissingDay, isFuture } =
            cell;

          const isSelected = selectedDate === dateString;

          // Precompute visual state
          let borderColor = "transparent";
          let borderWidth = 0;
          let backgroundColor = "transparent";
          let textColor = colors.textSecondary;
          let showIcon = false;
          let iconName: string | undefined;
          let iconColor: string | undefined;

          if (isFuture) {
            textColor = colors.textSecondary;
          } else if (isMissingDay) {
            textColor = colors.textSecondary;
            if (isSelected) {
              backgroundColor = `${colors.textSecondary}20`;
              borderWidth = 2;
              borderColor = colors.textSecondary;
            }
          } else if (checkIn) {
            const statusColor = getStatusColor(
              (checkIn as CheckInRecord).status,
              colors
            );

            textColor = colors.text;
            if (isSelected) {
              backgroundColor = `${statusColor}30`;
              borderWidth = 2;
              borderColor = statusColor;
            }

            showIcon = true;
            iconName = getStatusIcon((checkIn as CheckInRecord).status);
            iconColor = statusColor;
          }

          return (
            <Pressable
              key={dateString}
              style={[
                styles.calendarDay,
                {
                  backgroundColor,
                  borderColor,
                  borderWidth,
                  opacity: isFuture ? 0.3 : 1,
                },
              ]}
              onPress={() => {
                if (!isFuture) {
                  onSelectDate(dateString, isMissingDay);
                }
              }}
            >
              <ThemedText
                type="caption"
                style={{ color: textColor, marginBottom: 2 }}
              >
                {dayNumber}
              </ThemedText>

              {showIcon && iconName && iconColor && (
                <IconSymbol name={iconName} size={14} color={iconColor} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Memoize to avoid re-renders during modal animations
export const ExpandedCalendar = React.memo(ExpandedCalendarComponent);

// ----------------- Styles -----------------

const styles = StyleSheet.create({
  dayLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dayLabel: {
    width: 40,
    textAlign: "center",
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 4,
  },
  calendarDay: {
    width: "14.28%", // 7 days per week
    aspectRatio: 1, // square
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    borderRadius: 8,
  },
});
