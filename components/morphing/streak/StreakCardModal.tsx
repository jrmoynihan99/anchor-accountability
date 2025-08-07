import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { StreakCardContent } from "./StreakCardContent";
import {
  type StreakEntry,
  getCurrentStreak,
  getPersonalBest,
} from "./streakUtils";

interface StreakCardModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
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
  const gestureY = useSharedValue(0);
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const accent = colors.tint ?? "#CBAD8D";
  const mainTextColor = "#3A2D28";
  const fireColor = "#F47C1A";

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

  // Drag-to-close (swipe UP to close)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureY.value = 0;
    })
    .onUpdate((event) => {
      if (event.translationY < 0) {
        gestureY.value = event.translationY;
        const dragProgress = Math.min(Math.abs(event.translationY) / 200, 1);
        progress.value = 1 - dragProgress;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY < -100 || event.velocityY < -500;
      if (shouldClose) {
        progress.value = withTiming(
          0,
          { duration: 200, easing: Easing.inOut(Easing.quad) },
          (finished) => {
            if (finished) {
              runOnJS(close)(event.velocityY);
              gestureY.value = 0;
            }
          }
        );
      } else {
        progress.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
        gestureY.value = 0;
      }
    });

  // Animation styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.4]),
  }));
  const solidBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], "clamp"),
  }));
  const blurBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.1, 0.3], [0, 1], "clamp"),
  }));
  const modalContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.15, 1], [0, 1], "clamp"),
  }));
  const buttonContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0], "clamp"),
  }));

  const StatCard = ({
    icon,
    value,
    label,
    color = mainTextColor,
  }: {
    icon: string;
    value: string | number;
    label: string;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statCardContent}>
        <View
          style={[styles.statIconCircle, { backgroundColor: `${color}20` }]}
        >
          <IconSymbol name={icon} size={20} color={color} />
        </View>
        <View style={styles.statTextContainer}>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => close()}
    >
      {/* Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#000", zIndex: 10 },
          overlayStyle,
        ]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => close()}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal Card */}
      <Animated.View
        style={[
          modalAnimatedStyle,
          { overflow: "hidden", zIndex: 20, borderRadius: 28 },
        ]}
      >
        {/* Solid background (fades out) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.cardBackground },
            solidBackgroundStyle,
          ]}
        />

        {/* BlurView background (fades in) */}
        <Animated.View style={[StyleSheet.absoluteFill, blurBackgroundStyle]}>
          <BlurView
            intensity={24}
            tint={theme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                styles.blurBackground,
                { backgroundColor: `${colors.cardBackground}B8` },
              ]}
            />
          </BlurView>
        </Animated.View>

        {/* === STREAK CARD CONTENT (animates in/out) === */}
        <Animated.View
          style={[styles.streakCardButton, buttonContentStyle]}
          pointerEvents="box-none"
        >
          <View style={styles.streakButtonContent}>
            <StreakCardContent
              streakData={streakData}
              onCheckIn={onCheckIn}
              showButtons={true} // Show buttons during transition
            />
          </View>
        </Animated.View>

        {/* === MODAL CONTENT === */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContent, modalContentStyle]}>
            <TouchableOpacity
              onPress={() => close()}
              style={styles.closeButton}
              hitSlop={16}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={mainTextColor} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <IconSymbol name="flame.fill" size={40} color={fireColor} />
                <Text style={[styles.modalTitle, { color: mainTextColor }]}>
                  Your Progress
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <StatCard
                  icon="flame.fill"
                  value={currentStreak}
                  label="Current Streak"
                  color={fireColor}
                />
                <StatCard
                  icon="trophy.fill"
                  value={personalBest}
                  label="Personal Best"
                  color="#FFD700"
                />
                <StatCard
                  icon="calendar"
                  value={totalDays}
                  label="Days Tracked"
                />
                <StatCard
                  icon="chart.bar.fill"
                  value={`${Math.round(successRate)}%`}
                  label="Success Rate"
                  color="#4CAF50"
                />
              </View>

              {/* Recent Activity */}
              <Text style={[styles.sectionTitle, { color: mainTextColor }]}>
                Recent Activity
              </Text>
              <View style={styles.activityContainer}>
                <ScrollView
                  style={styles.activityScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {streakData
                    .slice(-14) // Show more entries since it's scrollable
                    .reverse()
                    .map((entry, index) => (
                      <View
                        key={entry.date}
                        style={[
                          styles.activityItem,
                          index === streakData.slice(-14).length - 1 &&
                            styles.lastActivityItem,
                        ]}
                      >
                        <Text style={styles.activityDate}>
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        <IconSymbol
                          name={
                            entry.status === "success"
                              ? "checkmark.circle.fill"
                              : "xmark.circle.fill"
                          }
                          size={20}
                          color={
                            entry.status === "success" ? "#4CAF50" : "#E57373"
                          }
                        />
                      </View>
                    ))}
                </ScrollView>
              </View>

              {/* Motivational Quote */}
              <View style={styles.quoteContainer}>
                <Text style={[styles.quote, { color: mainTextColor }]}>
                  "Progress, not perfection."
                </Text>
                <Text style={styles.quoteAuthor}>
                  Keep going, one day at a time.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.bottomDragIndicator} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  streakCardButton: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 10,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  streakButtonContent: {
    alignItems: "stretch", // Change from "flex-start" to "stretch" for full width
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  closeButton: {
    position: "absolute",
    top: 55,
    right: 30,
    zIndex: 30,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
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
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#8D7963",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  activityContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  lastActivityItem: {
    borderBottomWidth: 0, // Remove border from last item
  },
  activityDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8D7963",
  },
  quoteContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  quote: {
    fontSize: 18,
    fontWeight: "600",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: "#8D7963",
    textAlign: "center",
  },
  bottomDragIndicator: {
    position: "absolute",
    bottom: 12,
    width: 200,
    height: 4,
    backgroundColor: "rgba(58, 45, 40, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
  },
});
