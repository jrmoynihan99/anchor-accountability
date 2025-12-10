// components/morphing/accountability/RecentCheckInsSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getLocalTimeForTimezone } from "./accountabilityUtils";
import { CheckInDropdown } from "./recent-check-ins/CheckInDropdown";
import { CompactTimeline } from "./recent-check-ins/CompactTimeline";
import { ExpandedCalendar } from "./recent-check-ins/ExpandedCalendar";

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

interface RecentCheckInsSectionProps {
  checkIns: TimelineItem[];
  timezone?: string; // Renamed from userTimezone for consistency
  onFillMissing?: (date: string) => void; // Optional callback for retroactive fill
  onSelectFilled?: () => void; // Optional callback when filled day is selected
}

export function RecentCheckInsSection({
  checkIns,
  timezone,
  onFillMissing,
  onSelectFilled,
}: RecentCheckInsSectionProps) {
  const { colors } = useTheme();
  const [selectedCheckIn, setSelectedCheckIn] = useState<TimelineItem | null>(
    null
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHeight, setCalendarHeight] = useState(0);

  const animatedHeight = useSharedValue(0);
  const rotateValue = useSharedValue(0);

  // Get local time for the timezone
  const localTime = getLocalTimeForTimezone(timezone);

  // Sync selectedCheckIn with updated timeline data
  useEffect(() => {
    if (selectedCheckIn) {
      const updatedItem = checkIns.find(
        (item) => item.date === selectedCheckIn.date
      );
      if (updatedItem) {
        setSelectedCheckIn(updatedItem);
      }
    }
  }, [checkIns]);

  // Animate expansion
  useEffect(() => {
    animatedHeight.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    rotateValue.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isExpanded]);

  const isMissing = (item: TimelineItem): item is MissingCheckIn => {
    return "isMissing" in item && item.isMissing === true;
  };

  const handleItemClick = (item: TimelineItem) => {
    // Always update the selected item for visual feedback
    setSelectedCheckIn(item);

    // If it's a missing day and we have a callback, trigger it
    if (isMissing(item) && onFillMissing) {
      onFillMissing(item.date);
    } else if (!isMissing(item) && onSelectFilled) {
      // It's a filled day - trigger the filled callback
      onSelectFilled();
    }
  };

  const handleCalendarDateSelect = (
    dateString: string,
    isMissingDay: boolean
  ) => {
    const item: TimelineItem = isMissingDay
      ? { date: dateString, status: null, isMissing: true }
      : checkIns.find((ci) => ci.date === dateString) || {
          date: dateString,
          status: null,
          isMissing: true,
        };

    handleItemClick(item);
  };

  const handleCloseDropdown = () => {
    setSelectedCheckIn(null);
    if (onSelectFilled) onSelectFilled();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Animated styles
  const animatedCalendarStyle = useAnimatedStyle(() => {
    const targetHeight = calendarHeight || 300;
    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, targetHeight]),
      opacity: interpolate(animatedHeight.value, [0, 0.3, 1], [0, 0, 1]),
      transform: [
        {
          translateY: interpolate(animatedHeight.value, [0, 1], [10, 0]),
        },
      ],
    };
  });

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(rotateValue.value, [0, 1], [0, 180])}deg`,
        },
      ],
    };
  });

  const onCalendarLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setCalendarHeight(height);
  };

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
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={[
              styles.sectionIconCircle,
              { backgroundColor: `${colors.iconCircleBackground}50` },
            ]}
          >
            <IconSymbol name="chart.bar" size={16} color={colors.icon} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
              Recent Check-Ins
            </ThemedText>
            {localTime && (
              <ThemedText
                type="caption"
                style={{
                  color: colors.textSecondary,
                  opacity: 1,
                  marginTop: 2,
                }}
              >
                Local time: {localTime}
              </ThemedText>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
        >
          <Animated.View style={animatedChevronStyle}>
            <IconSymbol
              name="chevron.down"
              size={20}
              color={colors.textSecondary}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Compact Timeline (7 dots) */}
      <CompactTimeline
        checkIns={checkIns}
        selectedDate={selectedCheckIn?.date || null}
        onSelectItem={handleItemClick}
        userTimezone={timezone}
      />

      {/* Expanded Calendar View */}
      <Animated.View style={animatedCalendarStyle}>
        <ExpandedCalendar
          currentMonth={currentMonth}
          checkIns={checkIns}
          selectedDate={selectedCheckIn?.date || null}
          onSelectDate={handleCalendarDateSelect}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onLayout={onCalendarLayout}
          userTimezone={timezone}
        />
      </Animated.View>

      {/* Check-In Dropdown */}
      <CheckInDropdown
        selectedCheckIn={selectedCheckIn}
        onClose={handleCloseDropdown}
        showFillHint={!!onFillMissing}
        userTimezone={timezone}
      />
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
    justifyContent: "space-between",
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  expandButton: {
    padding: 8,
  },
});
