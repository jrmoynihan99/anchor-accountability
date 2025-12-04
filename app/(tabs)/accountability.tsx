import { ScrollingHeader } from "@/components/accountability/ScrollingHeader";
import { SupportingYouSection } from "@/components/accountability/SupportingYouSection";
import { YoureSupportingList } from "@/components/accountability/YoureSupportingList";
import { YoureSupportingSection } from "@/components/accountability/YoureSupportingSection";
import { EmptyMentorCard } from "@/components/morphing/accountability/EmptyMentorCard";
import { MentorCard } from "@/components/morphing/accountability/MentorCard";
import { MentorModal } from "@/components/morphing/accountability/MentorModal";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountabilityScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const { mentor, mentees, loading } = useAccountabilityRelationships();
  const hasMentor = !loading && mentor !== null;

  // Scroll animation values
  const scrollY = useSharedValue(0);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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
              const handleCheckIn = () => {
                // Open the modal for check-in
                open();
              };

              const handleSOS = () => {
                // TODO: Send SOS notification to mentor
                console.log("Send SOS to mentor:", mentor.mentorUid);
                // Maybe show a toast confirmation
              };

              return (
                <>
                  <MentorCard
                    mentorUid={mentor.mentorUid}
                    streak={mentor.streak}
                    lastCheckIn={mentor.lastCheckIn}
                    onCheckIn={handleCheckIn}
                    onSOS={handleSOS}
                    buttonRef={buttonRef}
                    style={buttonAnimatedStyle}
                    onPress={open}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  />
                  <MentorModal
                    mentorUid={mentor.mentorUid}
                    streak={mentor.streak}
                    lastCheckIn={mentor.lastCheckIn}
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
        {!loading && <YoureSupportingList />}
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
