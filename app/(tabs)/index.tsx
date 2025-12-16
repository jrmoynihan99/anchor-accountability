import { CommunityCard } from "@/components/home/CommunityCard";
import { MentorModal } from "@/components/morphing/accountability/MentorModal";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { MentorCardCompact } from "@/components/morphing/home/accountability/MentorCardCompact";
import { MentorCardCompactContent } from "@/components/morphing/home/accountability/MentorCardCompactContent";
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
import { useAccountability } from "@/context/AccountabilityContext";
import { useModalIntent } from "@/context/ModalIntentContext";
import { useTheme } from "@/hooks/ThemeContext";
import { useStreakData } from "@/hooks/useStreakData";
import { useThreads } from "@/hooks/useThreads";
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const { streakData, updateStreakStatus } = useStreakData();
  const { mentor, loading } = useAccountability();
  const { threads } = useThreads();
  const currentUid = auth.currentUser?.uid;
  const hasMentor = !loading && mentor !== null;

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

  const handleMessageMentor = (mentorUid: string) => {
    if (!currentUid) return;

    // find the thread where this mentor is the other user
    const thread = threads.find(
      (t) =>
        (t.userA === currentUid && t.userB === mentorUid) ||
        (t.userB === currentUid && t.userA === mentorUid)
    );

    if (!thread) {
      console.log("No thread found with that mentor!");
      return;
    }

    router.push({
      pathname: "/message-thread",
      params: {
        threadId: thread.id,
      },
    });
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

        {/* ---- Mentor Card (Compact) ---- */}
        {hasMentor && (
          <ButtonModalTransitionBridge
            buttonBorderRadius={20}
            modalBorderRadius={28}
            modalWidthPercent={0.95}
            modalHeightPercent={0.85}
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
              // ✅ One-time measurement to enable proper morph animation
              React.useEffect(() => {
                const timer = setTimeout(() => {
                  handlePressIn();
                  setTimeout(() => {
                    handlePressOut();
                  }, 10);
                }, 100);
                return () => clearTimeout(timer);
              }, []);

              const handleCheckIn = () => {
                open();
              };

              return (
                <>
                  <MentorCardCompact
                    mentorUid={mentor.mentorUid}
                    streak={mentor.streak}
                    checkInStatus={mentor.checkInStatus}
                    mentorTimezone={mentor.mentorTimezone}
                    onCheckIn={handleCheckIn}
                    onMessage={() => handleMessageMentor(mentor.mentorUid)}
                    buttonRef={buttonRef}
                    style={buttonAnimatedStyle}
                    onPress={open}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  />
                  <MentorModal
                    mentorUid={mentor.mentorUid}
                    streak={mentor.streak}
                    checkInStatus={mentor.checkInStatus}
                    mentorTimezone={mentor.mentorTimezone}
                    relationshipId={mentor.id}
                    isVisible={isModalVisible}
                    progress={progress}
                    modalAnimatedStyle={modalAnimatedStyle}
                    close={close}
                    buttonContent={
                      <View style={styles.buttonContent}>
                        <MentorCardCompactContent
                          mentorUid={mentor.mentorUid}
                          streak={mentor.streak}
                          checkInStatus={mentor.checkInStatus}
                          mentorTimezone={mentor.mentorTimezone}
                          showExpandIcon={true}
                        />
                      </View>
                    }
                  />
                </>
              );
            }}
          </ButtonModalTransitionBridge>
        )}

        {/* ---- Guided Prayer ---- */}
        <ButtonModalTransitionBridge>
          {({
            open,
            openOriginless,
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
            guidedPrayerOpenRef.current = openOriginless;

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

        {/* ---- Community Card ---- */}
        <CommunityCard />
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
  buttonContent: {
    padding: 0,
  },
  blurHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
