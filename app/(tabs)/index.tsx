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
import { useModalIntent } from "@/context/ModalIntentContext";
import { useTheme } from "@/hooks/ThemeContext";
import { useStreakData } from "@/hooks/useStreakData";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const { streakData, updateStreakStatus } = useStreakData();

  const guidedPrayerOpenRef = useRef<(() => void) | null>(null);
  const reachOutCloseRef = useRef<((velocity?: number) => void) | null>(null);

  // Add ref for VerseCarousel
  const verseCarouselRef = useRef<VerseCarouselRef>(null);

  // --- Modal Intent context handling ---
  const { modalIntent, setModalIntent } = useModalIntent();

  useEffect(() => {
    if (modalIntent === "guidedPrayer") {
      setTimeout(() => {
        if (guidedPrayerOpenRef.current) guidedPrayerOpenRef.current();
        setModalIntent(null); // clear after use
      }, 500);
    }
    if (modalIntent === "verse") {
      setTimeout(() => {
        if (verseCarouselRef.current)
          verseCarouselRef.current.openTodayInContext();
        setModalIntent(null); // clear after use
      }, 500);
    }
  }, [modalIntent, setModalIntent]);

  const handleStreakCheckIn = async (status: "success" | "fail") => {
    // Find the date we're supposed to be checking in for
    const dateToAsk = getDateToAskAbout(streakData);

    if (dateToAsk) {
      await updateStreakStatus(dateToAsk.date, status);
    } else {
      // Fallback: update today's date (though this shouldn't happen in normal flow)
      const today = new Date().toISOString().split("T")[0];
      await updateStreakStatus(today, status);
    }
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
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
      >
        {/* Add ref to VerseCarousel */}
        <VerseCarousel ref={verseCarouselRef} />

        {/* ---- Reach Out ---- */}
        <ButtonModalTransitionBridge
          modalWidthPercent={0.9}
          modalHeightPercent={0.75}
        >
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
            openOriginless, // 👈 NEW
            close,
            isModalVisible,
            progress,
            buttonAnimatedStyle,
            modalAnimatedStyle,
            buttonRef,
            handlePressIn,
            handlePressOut,
          }) => {
            // Use originless opener for programmatic global-intent opens
            guidedPrayerOpenRef.current = openOriginless; // 👈 NEW

            return (
              <>
                <GuidedPrayer
                  buttonRef={buttonRef}
                  style={buttonAnimatedStyle}
                  onPress={open} // tap → morph from card (unchanged)
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onBeginPrayer={open} // tap from inside → morph (unchanged)
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

      {/* Invisible Blur Header - Only shows blur when content passes under */}
      <View
        style={[
          styles.blurHeader,
          { height: insets.top + 10, pointerEvents: "none" },
        ]}
      >
        <MaskedView
          style={{ flex: 1 }}
          maskElement={
            <LinearGradient
              colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
              locations={[0.4, 1]} // fade bottom 30%
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          }
        >
          <BlurView
            intensity={50}
            tint={effectiveTheme === "dark" ? "dark" : "light"}
            style={{ flex: 1 }}
          >
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: colors.background,
                opacity: Platform.OS === "ios" ? 0.4 : 0.95,
              }}
            />
          </BlurView>
        </MaskedView>
      </View>
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
  blurHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
