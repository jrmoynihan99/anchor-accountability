import { GuidedPrayer } from "@/components/GuidedPrayer";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { ReachOutButton } from "@/components/morphing/reach-out-main-button/ReachOutButton";
import { ReachOutModal } from "@/components/morphing/reach-out-main-button/ReachOutModal";
import { StreakCard } from "@/components/morphing/streak/StreakCard";
import { VerseCarousel } from "@/components/VerseCarousel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const theme = useColorScheme();
  const bgColor = Colors[theme ?? "dark"].background;
  const insets = useSafeAreaInsets();

  const today = new Date();
  function getDate(offset: number) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    // Format as YYYY-MM-DD
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Test scenarios - uncomment the one you want to test
  const getTestScenario = (scenario: string) => {
    switch (scenario) {
      case "fresh-start":
        // Brand new user - should ask about yesterday
        return [
          { date: getDate(-1), status: "pending" }, // yesterday
          { date: getDate(0), status: "pending" }, // today
        ];

      case "active-streak-catchup":
        // User with 2-day streak, missed a few days - should ask about earliest missing day
        return [
          { date: getDate(-5), status: "success" }, // 5 days ago
          { date: getDate(-4), status: "success" }, // 4 days ago - streak = 2
          { date: getDate(-3), status: "pending" }, // 3 days ago - should ask about this first
          { date: getDate(-2), status: "pending" }, // 2 days ago
          { date: getDate(-1), status: "pending" }, // yesterday
          { date: getDate(0), status: "pending" }, // today
        ];

      case "failed-yesterday":
        // User had a streak but failed yesterday - should ask about yesterday, then encourage new streak
        return [
          { date: getDate(-3), status: "success" }, // 3 days ago
          { date: getDate(-2), status: "success" }, // 2 days ago
          { date: getDate(-1), status: "pending" }, // yesterday - will fail this
          { date: getDate(0), status: "pending" }, // today
        ];

      case "completed-yesterday":
        // User completed yesterday successfully - should show encouragement for tomorrow
        return [
          { date: getDate(-2), status: "success" }, // 2 days ago
          { date: getDate(-1), status: "success" }, // yesterday - already completed
          { date: getDate(0), status: "pending" }, // today - don't ask about this
        ];

      case "long-streak":
        // User with long streak, close to personal best
        return [
          { date: getDate(-10), status: "success" },
          { date: getDate(-9), status: "success" },
          { date: getDate(-8), status: "success" },
          { date: getDate(-7), status: "fail" }, // broke streak here
          { date: getDate(-6), status: "success" }, // new streak starts
          { date: getDate(-5), status: "success" },
          { date: getDate(-4), status: "success" },
          { date: getDate(-3), status: "success" },
          { date: getDate(-2), status: "success" }, // current streak = 5, personal best = 6
          { date: getDate(-1), status: "pending" }, // yesterday
          { date: getDate(0), status: "pending" }, // today
        ];

      default:
        return getTestScenario("fresh-start");
    }
  };

  // Change this to test different scenarios:
  const [currentScenario] = useState("active-streak-catchup");
  const [streakData, setStreakData] = useState(
    getTestScenario(currentScenario)
  );

  const handleStreakCheckIn = (status: "success" | "fail") => {
    setStreakData((prev) => {
      // Always update the date that StreakCard is currently asking about
      // This should be yesterday if no streak, or the earliest pending if has streak
      const sortedData = [...prev].sort((a, b) => a.date.localeCompare(b.date));

      // Count current active streak
      let currentStreak = 0;
      let lastFailIndex = -1;

      // Find last failure
      for (let i = sortedData.length - 1; i >= 0; i--) {
        if (sortedData[i].status === "fail") {
          lastFailIndex = i;
          break;
        }
      }

      // Count successes after last failure
      for (let i = lastFailIndex + 1; i < sortedData.length; i++) {
        if (sortedData[i].status === "success") {
          currentStreak++;
        }
      }

      // Determine which date to update (same logic as StreakCard)
      let dateToUpdate;
      if (currentStreak === 0) {
        // No active streak - should be asking about yesterday
        const yesterday = getDate(-1);
        dateToUpdate = yesterday;
      } else {
        // Has active streak - should be asking about earliest pending
        const pendingEntries = prev.filter((e) => e.status === "pending");
        const sortedPending = pendingEntries.sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        dateToUpdate = sortedPending[0]?.date;
      }

      // Update the specific date
      return prev.map((entry) =>
        entry.date === dateToUpdate ? { ...entry, status } : entry
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 120, // Extra space for floating navigation
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <VerseCarousel />

        {/* ---- Button + Modal Transition Bridge ---- */}
        <ButtonModalTransitionBridge>
          {({
            open,
            close,
            isModalVisible,
            progress,
            buttonAnimatedStyle,
            modalAnimatedStyle,
            buttonRef,
            handlePressIn,
            handlePressOut,
          }) => (
            <>
              <ReachOutButton
                buttonRef={buttonRef}
                style={buttonAnimatedStyle}
                onPress={open}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              />
              <ReachOutModal
                isVisible={isModalVisible}
                progress={progress}
                modalAnimatedStyle={modalAnimatedStyle}
                close={close}
              />
            </>
          )}
        </ButtonModalTransitionBridge>

        <StreakCard streakData={streakData} onCheckIn={handleStreakCheckIn} />

        <GuidedPrayer
          onPress={() => {
            // Handle guided prayer start
            console.log("Starting guided prayer...");
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
});
