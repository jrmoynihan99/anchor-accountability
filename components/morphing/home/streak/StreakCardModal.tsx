// StreakCardModal.tsx - Updated with Timeline Section
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol, type IconSymbolName } from "@/components/ui/IconSymbol";

import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { StreakTimelineSection } from "./streak-timeline/StreakTimelineSection";
import { StreakCardContent } from "./StreakCardContent";
import {
  type StreakEntry,
  getCurrentStreak,
  getPersonalBest,
} from "./streakUtils";

interface StreakCardModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  streakData: StreakEntry[];
  onCheckIn: (status: "success" | "fail") => void;
  onUndo: (date: string) => void;
  showUndo?: boolean;
  lastModifiedDate?: string | null;
  onUndoStateChange?: (showUndo: boolean, date: string | null) => void;
}

export function StreakCardModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  streakData,
  onCheckIn,
  onUndo,
  showUndo,
  lastModifiedDate,
  onUndoStateChange,
}: StreakCardModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Helper functions for stats
  const getTotalDaysTracked = (data: StreakEntry[]) => {
    return data.filter(
      (entry) => entry.status === "success" || entry.status === "fail"
    ).length;
  };

  const getSuccessRate = (data: StreakEntry[]) => {
    const trackedEntries = data.filter(
      (entry) => entry.status === "success" || entry.status === "fail"
    );
    if (trackedEntries.length === 0) return 0;
    const successCount = trackedEntries.filter(
      (entry) => entry.status === "success"
    ).length;
    return (successCount / trackedEntries.length) * 100;
  };

  // Calculate streak stats
  const currentStreak = getCurrentStreak(streakData);
  const personalBest = getPersonalBest(streakData);
  const totalDays = getTotalDaysTracked(streakData);
  const successRate = getSuccessRate(streakData);

  const StatCard = ({
    icon,
    value,
    label,
    color = colors.text,
  }: {
    icon: IconSymbolName;
    value: string | number;
    label: string;
    color?: string;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={{ alignItems: "center" }}>
        {/* Icon and value inline */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <View
            style={[
              styles.statIconCircle,
              { backgroundColor: `${color}33`, marginRight: 6 },
            ]}
          >
            <IconSymbol name={icon} size={20} color={color} />
          </View>
          <ThemedText type="statValue" style={[styles.statValue, { color }]}>
            {value}
          </ThemedText>
        </View>
        {/* Label below */}
        <ThemedText
          type="statLabel"
          style={[
            styles.statLabel,
            { color: colors.textSecondary, textAlign: "center" },
          ]}
        >
          {label}
        </ThemedText>
      </View>
    </View>
  );

  // Button content (what shows during the transition)
  const buttonContent = (
    <View style={styles.streakButtonContent}>
      <StreakCardContent
        streakData={streakData}
        onCheckIn={onCheckIn}
        onUndo={onUndo}
        showButtons={true}
        showUndo={showUndo}
        lastModifiedDate={lastModifiedDate}
        onUndoStateChange={onUndoStateChange}
      />
    </View>
  );

  // Modal content
  const modalContent = (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <IconSymbol name="flame.fill" size={40} color={colors.fireColor} />
        <ThemedText
          type="titleLarge"
          style={[
            styles.modalTitle,
            {
              color: colors.text,
              marginTop: 12,
              textAlign: "center",
            },
          ]}
        >
          Your Progress
        </ThemedText>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="flame.fill"
          value={currentStreak}
          label="Current Streak"
          color={colors.fireColor}
        />
        <StatCard
          icon="trophy.fill"
          value={personalBest}
          label="Personal Best"
          color={colors.achievement}
        />
        <StatCard icon="calendar" value={totalDays} label="Days Tracked" />
        <StatCard
          icon="chart.bar.fill"
          value={`${Math.round(successRate)}%`}
          label="Success Rate"
          color={colors.success}
        />
      </View>

      {/* NEW: Streak Timeline Section */}
      <StreakTimelineSection streakData={streakData} />
    </ScrollView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonContent={buttonContent}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  streakButtonContent: {
    alignItems: "stretch", // Full width for the streak card
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 32,
  },
  modalTitle: {
    // Typography styles moved to Typography.styles.titleLarge + inline styles
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statCard: {
    width: "48%",
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statValue: {
    // Typography styles moved to Typography.styles.statValue + inline styles
  },
  statLabel: {
    // Typography styles moved to Typography.styles.statLabel
  },
});
