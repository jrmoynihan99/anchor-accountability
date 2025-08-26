import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { GuidedPrayer } from "@/components/morphing/home/guided-prayer/GuidedPrayer";
import { GuidedPrayerModal } from "@/components/morphing/home/guided-prayer/GuidedPrayerModal";
import { ReachOutButton } from "@/components/morphing/home/reach-out-main-button/ReachOutButton";
import { ReachOutModal } from "@/components/morphing/home/reach-out-main-button/ReachOutModal";
import { StreakCard } from "@/components/morphing/home/streak/StreakCard";
import { StreakCardModal } from "@/components/morphing/home/streak/StreakCardModal";
import { getDateToAskAbout } from "@/components/morphing/home/streak/streakUtils";
import {
  VerseCarousel,
  VerseCarouselRef,
} from "@/components/morphing/home/verse/VerseCarousel";
import { useTheme } from "@/hooks/ThemeContext";
import { savePushTokenToFirestore } from "@/hooks/usePushNotifications";
import { useStreakData } from "@/hooks/useStreakData";
import { auth } from "@/lib/firebase";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const { streakData, updateStreakStatus } = useStreakData();

  const guidedPrayerOpenRef = useRef<(() => void) | null>(null);
  const reachOutCloseRef = useRef<((velocity?: number) => void) | null>(null);

  // Add ref for VerseCarousel
  const verseCarouselRef = useRef<VerseCarouselRef>(null);

  useEffect(() => {
    savePushTokenToFirestore();
  }, []);

  // Debug logging for authentication and data
  useEffect(() => {
    console.log(`🔍 HomeScreen: Current user:`, auth.currentUser?.uid);
    console.log(`🔍 HomeScreen: User email:`, auth.currentUser?.email);
    console.log(`🔍 HomeScreen: Streak data length:`, streakData.length);
    console.log(`🔍 HomeScreen: Streak data:`, streakData);

    if (streakData.length > 0) {
      const dateToAsk = getDateToAskAbout(streakData);
    }
  }, [streakData]);

  const handleStreakCheckIn = async (status: "success" | "fail") => {
    console.log(
      `🔍 HomeScreen: handleStreakCheckIn called with status:`,
      status
    );

    // Find the date we're supposed to be checking in for
    const dateToAsk = getDateToAskAbout(streakData);
    console.log(`🔍 HomeScreen: Date to ask about:`, dateToAsk);

    if (dateToAsk) {
      // Update the specific date that was being asked about
      console.log(
        `🔍 HomeScreen: Updating date ${dateToAsk.date} with status ${status}`
      );
      await updateStreakStatus(dateToAsk.date, status);
    } else {
      // Fallback: update today's date (though this shouldn't happen in normal flow)
      const today = new Date().toISOString().split("T")[0];
      console.log(
        `🔍 HomeScreen: No date to ask about, updating today (${today}) with status ${status}`
      );
      await updateStreakStatus(today, status);
    }

    console.log(
      "Checked in with status:",
      status,
      "for date:",
      dateToAsk?.date
    );
  };

  const handleOpenGuidedPrayer = () => {
    if (reachOutCloseRef.current) reachOutCloseRef.current();
    setTimeout(() => {
      if (guidedPrayerOpenRef.current) guidedPrayerOpenRef.current();
    }, 200);
  };

  // Add new handler for opening verse modal from ReachOut
  const handleOpenVerseModal = () => {
    if (reachOutCloseRef.current) reachOutCloseRef.current();

    setTimeout(() => {
      if (verseCarouselRef.current) {
        verseCarouselRef.current.openTodayInContext();
      }
    }, 200);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add ref to VerseCarousel */}
        <VerseCarousel ref={verseCarouselRef} />

        {/* ---- Reach Out ---- */}
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
          }) => {
            reachOutCloseRef.current = close;

            return (
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
                  onGuidedPrayer={handleOpenGuidedPrayer}
                  onReadScripture={handleOpenVerseModal} // Add this new prop
                />
              </>
            );
          }}
        </ButtonModalTransitionBridge>

        {/* ---- Streak Card ---- */}
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
              <StreakCard
                streakData={streakData}
                onCheckIn={handleStreakCheckIn}
                buttonRef={buttonRef}
                style={buttonAnimatedStyle}
                onPress={open}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              />
              <StreakCardModal
                isVisible={isModalVisible}
                progress={progress}
                modalAnimatedStyle={modalAnimatedStyle}
                close={close}
                streakData={streakData}
                onCheckIn={handleStreakCheckIn}
              />
            </>
          )}
        </ButtonModalTransitionBridge>

        {/* ---- Guided Prayer ---- */}
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
          }) => {
            guidedPrayerOpenRef.current = open;

            return (
              <>
                <GuidedPrayer
                  buttonRef={buttonRef}
                  style={buttonAnimatedStyle}
                  onPress={open}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onBeginPrayer={open}
                />
                <GuidedPrayerModal
                  isVisible={isModalVisible}
                  progress={progress}
                  modalAnimatedStyle={modalAnimatedStyle}
                  close={close}
                />
              </>
            );
          }}
        </ButtonModalTransitionBridge>
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
