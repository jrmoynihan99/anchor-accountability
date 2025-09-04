// StreakCardModal.tsx - Refactored
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BaseModal } from "../../BaseModal";
import { StreakCardContent } from "./StreakCardContent";
import {
  type StreakEntry,
  filterUpToToday,
  formatDateWithWeekday,
  getCurrentStreak,
  getPersonalBest,
  isToday,
} from "./streakUtils";

interface StreakCardModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  streakData: StreakEntry[];
  onCheckIn: (status: "success" | "fail") => void;
}

export function StreakCardModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  streakData,
  onCheckIn,
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
    icon: string;
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
      <View style={styles.statCardContent}>
        <View
          style={[styles.statIconCircle, { backgroundColor: `${color}33` }]} // 20% opacity
        ></View>
        <View style={styles.statTextContainer}>
          <ThemedText
            type="statValue"
            style={[
              styles.statValue,
              {
                color,
                marginBottom: 2,
              },
            ]}
          >
            {value}
          </ThemedText>
          <ThemedText
            type="statLabel"
            style={[styles.statLabel, { color: colors.textSecondary }]}
          >
            {label}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  // Button content (what shows during the transition)
  const buttonContent = (
    <View style={styles.streakButtonContent}>
      <StreakCardContent
        streakData={streakData}
        onCheckIn={onCheckIn}
        showButtons={true} // Show buttons during transition
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

      {/* Recent Activity */}
      {/* Recent Activity */}
      <ThemedText
        type="title"
        style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}
      >
        Recent Activity
      </ThemedText>

      <View
        style={[
          styles.activityContainer,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ScrollView
          style={styles.activityScrollView}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {(() => {
            // Only show entries up to (and including) today (local)
            const visible = filterUpToToday(streakData);

            // Last 14, newest first in UI
            const last14 = visible.slice(-14);
            const items = [...last14].reverse();

            return items.map((entry, index) => (
              <View
                key={entry.date}
                style={[
                  styles.activityItem,
                  { borderBottomColor: colors.modalCardBorder },
                  index === items.length - 1 && styles.lastActivityItem,
                ]}
              >
                <ThemedText
                  type="caption"
                  style={[styles.activityDate, { color: colors.textSecondary }]}
                >
                  {formatDateWithWeekday(entry.date)}
                </ThemedText>

                {entry.status === "pending" ? (
                  // Only today shows "In Progress"; past pending shows clock icon
                  isToday(entry.date) ? (
                    <ThemedText
                      type="caption"
                      style={{
                        color: colors.textSecondary,
                        fontStyle: "italic",
                      }}
                    >
                      In Progress
                    </ThemedText>
                  ) : (
                    <IconSymbol
                      name="clock.badge.questionmark"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )
                ) : (
                  <IconSymbol
                    name={
                      entry.status === "success"
                        ? "checkmark.circle.fill"
                        : "xmark.circle.fill"
                    }
                    size={20}
                    color={
                      entry.status === "success" ? colors.success : colors.error
                    }
                  />
                )}
              </View>
            ));
          })()}
        </ScrollView>
      </View>

      {/* Motivational Quote */}
      <View
        style={[
          styles.quoteContainer,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText
          type="quoteText"
          style={[
            styles.quote,
            {
              color: colors.text,
              textAlign: "center",
              marginBottom: 8,
            },
          ]}
        >
          "Progress, not perfection."
        </ThemedText>
        <ThemedText
          type="caption"
          style={[
            styles.quoteAuthor,
            {
              color: colors.textSecondary,
              textAlign: "center",
            },
          ]}
        >
          Keep going, one day at a time.
        </ThemedText>
      </View>
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
    elevation: 1,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    // Typography styles moved to Typography.styles.statValue + inline styles
  },
  statLabel: {
    // Typography styles moved to Typography.styles.statLabel
  },
  sectionTitle: {
    // Typography styles moved to Typography.styles.title + inline styles
  },
  activityContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    maxHeight: 240, // Limit height to make it scrollable
  },
  activityScrollView: {
    maxHeight: 230, // Slightly less than container to account for padding
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  lastActivityItem: {
    borderBottomWidth: 0, // Remove border from last item
  },
  activityDate: {
    // Typography styles moved to Typography.styles.caption
  },
  quoteContainer: {
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  quote: {
    // Typography styles moved to Typography.styles.quoteText + inline styles
  },
  quoteAuthor: {
    // Typography styles moved to Typography.styles.caption + inline styles
  },
});
