import { ScrollingHeader } from "@/components/accountability/ScrollingHeader";
import { SupportingYouSection } from "@/components/accountability/SupportingYouSection";
import { YoureSupportingList } from "@/components/accountability/YoureSupportingList";
import { YoureSupportingSection } from "@/components/accountability/YoureSupportingSection";
import { EmptyMentorCard } from "@/components/morphing/accountability/mentor/EmptyMentorCard";
import { MentorCard } from "@/components/morphing/accountability/mentor/MentorCard";
import { MentorModal } from "@/components/morphing/accountability/mentor/MentorModal";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/context/ThemeContext";
import { useThreads } from "@/hooks/useThreads";
import { auth } from "@/lib/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountabilityScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const { mentor, mentees, loading } = useAccountability();
  const { threads } = useThreads();
  const currentUid = auth.currentUser?.uid;
  const hasMentor = !loading && mentor !== null;

  // Get notification params
  const { openMentorModal, openMenteeRelationship } = useLocalSearchParams<{
    openMentorModal?: string;
    openMenteeRelationship?: string;
  }>();

  // Scroll animation values
  const scrollY = useSharedValue(0);

  // Refs for modal controls
  const mentorModalRef = useRef<{ open: () => void } | null>(null);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleMessageMentor = (mentorUid: string) => {
    if (!currentUid) return;

    // find the thread where this mentor is the other user
    const thread = threads.find(
      (t) =>
        (t.userA === currentUid && t.userB === mentorUid) ||
        (t.userB === currentUid && t.userA === mentorUid)
    );

    if (!thread) {
      return;
    }

    router.push({
      pathname: "/message-thread",
      params: {
        threadId: thread.id,
      },
    });
  };

  // Handle opening MentorModal from notification
  useEffect(() => {
    if (
      openMentorModal === "true" &&
      hasMentor &&
      !loading &&
      mentorModalRef.current
    ) {
      setTimeout(() => {
        mentorModalRef.current?.open();
        // Clear the param so it doesn't re-trigger
        router.setParams({ openMentorModal: undefined });
      }, 500);
    }
  }, [openMentorModal, hasMentor, loading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
      >
        {/* Supporting You Section Header */}
        <SupportingYouSection scrollY={scrollY} />

        {/* Mentor Card or Empty State */}
        {hasMentor ? (
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
              // Store the open function for notification deep linking
              mentorModalRef.current = { open };

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
                  <MentorCard
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
                  />
                </>
              );
            }}
          </ButtonModalTransitionBridge>
        ) : (
          !loading && <EmptyMentorCard />
        )}

        {/* You're Supporting Section Header */}
        <YoureSupportingSection />

        {/* Mentees List (includes empty states) */}
        {!loading && (
          <YoureSupportingList
            openMenteeRelationship={openMenteeRelationship}
          />
        )}
      </Animated.ScrollView>

      {/* Sticky Header */}
      <ScrollingHeader scrollY={scrollY} />
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
