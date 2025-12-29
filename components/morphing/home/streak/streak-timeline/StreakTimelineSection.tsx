// components/morphing/accountability/streak-timeline/StreakTimelineSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { CompactStreakTimeline } from "./CompactStreakTimeline";
import { ExpandedStreakCalendar } from "./ExpandedStreakCalendar";
import { StreakDropdown } from "./StreakDropdown";

export interface StreakEntry {
  date: string; // YYYY-MM-DD format
  status: "success" | "fail" | "pending";
}

interface StreakTimelineSectionProps {
  streakData: StreakEntry[];
  onDaySelect?: (date: string) => void; // Optional callback when a day is selected
}

export const StreakTimelineSection = React.memo(function StreakTimelineSection({
  streakData,
  onDaySelect,
}: StreakTimelineSectionProps) {
  const { colors } = useTheme();
  const [selectedEntry, setSelectedEntry] = useState<StreakEntry | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarHeight, setCalendarHeight] = useState(0);

  const animatedHeight = useSharedValue(0);
  const rotateValue = useSharedValue(0);

  // Sync selectedEntry with updated streak data
  useEffect(() => {
    if (selectedEntry) {
      const updatedEntry = streakData.find(
        (entry) => entry.date === selectedEntry.date
      );
      if (updatedEntry) {
        setSelectedEntry(updatedEntry);
      }
    }
  }, [streakData]);

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

  const handleDayClick = (entry: StreakEntry) => {
    setSelectedEntry(entry);
    if (onDaySelect) {
      onDaySelect(entry.date);
    }
  };

  const handleCalendarDateSelect = (dateString: string) => {
    const entry = streakData.find((e) => e.date === dateString);
    if (entry) {
      handleDayClick(entry);
    }
  };

  const handleCloseDropdown = () => {
    setSelectedEntry(null);
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
              Recent Activity
            </ThemedText>
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
      <CompactStreakTimeline
        streakData={streakData}
        selectedDate={selectedEntry?.date || null}
        onSelectDay={handleDayClick}
      />

      {/* Expanded Calendar View - Only mount when expanded */}
      {isExpanded && (
        <Animated.View style={animatedCalendarStyle}>
          <ExpandedStreakCalendar
            currentMonth={currentMonth}
            streakData={streakData}
            selectedDate={selectedEntry?.date || null}
            onSelectDate={handleCalendarDateSelect}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            onLayout={onCalendarLayout}
          />
        </Animated.View>
      )}

      {/* Streak Dropdown */}
      <StreakDropdown
        selectedEntry={selectedEntry}
        onClose={handleCloseDropdown}
      />
    </View>
  );
});

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
