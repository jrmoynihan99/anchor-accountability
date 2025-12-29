// components/morphing/accountability/streak-timeline/ExpandedStreakCalendar.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MonthNavigation } from "./MonthNavigation";
import { generateCalendar, isDateInFuture } from "./streakCalendarUtils";

// ----------------- Types -----------------

export interface StreakEntry {
  date: string; // YYYY-MM-DD format
  status: "success" | "fail" | "pending";
}

interface ExpandedStreakCalendarProps {
  currentMonth: Date;
  streakData: StreakEntry[];
  selectedDate: string | null;
  onSelectDate: (dateString: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onLayout?: (event: any) => void;
}

type MonthCell =
  | { empty: true }
  | {
      empty: false;
      dateString: string;
      entry: StreakEntry | null;
      dayNumber: number;
      isFuture: boolean;
    };

// ----------------- Helper Functions -----------------

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

// ----------------- Memoized Calendar Cell -----------------

interface CalendarDayProps {
  dateString: string;
  dayNumber: number;
  isSelected: boolean;
  isFuture: boolean;
  entry: StreakEntry | null;
  onSelectDate: (dateString: string) => void;
  colors: any;
}

const CalendarDay = React.memo(function CalendarDay({
  dateString,
  dayNumber,
  isSelected,
  isFuture,
  entry,
  onSelectDate,
  colors,
}: CalendarDayProps) {
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
  } else if (!entry || entry.status === "pending") {
    // No data or pending
    textColor = colors.textSecondary;
    if (isSelected) {
      backgroundColor = `${colors.textSecondary}20`;
      borderWidth = 2;
      borderColor = colors.textSecondary;
    }
  } else {
    // Has success or fail data
    const statusColor = getStatusColor(entry.status, colors);

    textColor = colors.text;
    if (isSelected) {
      backgroundColor = `${statusColor}30`;
      borderWidth = 2;
      borderColor = statusColor;
    }

    showIcon = true;
    iconName = getStatusIcon(entry.status);
    iconColor = statusColor;
  }

  return (
    <Pressable
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
          onSelectDate(dateString);
        }
      }}
    >
      <ThemedText type="caption" style={{ color: textColor, marginBottom: 2 }}>
        {dayNumber}
      </ThemedText>

      {showIcon && iconName && iconColor && (
        <IconSymbol name={iconName} size={14} color={iconColor} />
      )}
    </Pressable>
  );
});

// ----------------- Component -----------------

function ExpandedStreakCalendarComponent({
  currentMonth,
  streakData,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onLayout,
}: ExpandedStreakCalendarProps) {
  const { colors } = useTheme();

  // O(1) lookup table for streak entries by date
  const entryMap = useMemo<Record<string, StreakEntry>>(() => {
    const map: Record<string, StreakEntry> = {};
    for (const entry of streakData) {
      map[entry.date] = entry;
    }
    return map;
  }, [streakData]);

  // Precompute all data needed to render the month grid
  const monthData: MonthCell[] = useMemo(() => {
    const dates = generateCalendar(currentMonth);

    return dates.map<MonthCell>((d) => {
      if (d === null) {
        return { empty: true };
      }

      const dateString = d;
      const entry = entryMap[dateString] ?? null;
      const dayNumber = Number(dateString.slice(8, 10));
      const isFuture = isDateInFuture(dateString);

      return {
        empty: false,
        dateString,
        entry,
        dayNumber,
        isFuture,
      };
    });
  }, [currentMonth, entryMap]);

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

          return (
            <CalendarDay
              key={cell.dateString}
              dateString={cell.dateString}
              dayNumber={cell.dayNumber}
              isSelected={selectedDate === cell.dateString}
              isFuture={cell.isFuture}
              entry={cell.entry}
              onSelectDate={onSelectDate}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

// Memoize to avoid re-renders during modal animations
export const ExpandedStreakCalendar = React.memo(
  ExpandedStreakCalendarComponent
);

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
