import { useTheme } from "@/hooks/ThemeContext";
import { getTodayDateString, useCheckIns } from "@/hooks/useCheckIns";
import { useThreads } from "@/hooks/useThreads";
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { AccountabilityModalHeader } from "./AccountabilityModalHeader";
import { CheckInStatus } from "./accountabilityUtils";
import { CheckInSection } from "./CheckInSection";
import { EndRelationship } from "./EndRelationship";
import { MentorCardContent } from "./MentorCardContent";
import { RecentCheckInsSection } from "./RecentCheckInsSection";

interface MentorModalProps {
  mentorUid: string;
  streak: number;
  checkInStatus: CheckInStatus;
  mentorTimezone?: string;
  relationshipId: string;
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  buttonContent?: React.ReactNode; // Optional override
}

export function MentorModal({
  mentorUid,
  streak,
  checkInStatus,
  mentorTimezone, // ADD THIS
  relationshipId,
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  buttonContent: customButtonContent, // Optional override
}: MentorModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const uid = auth.currentUser?.uid || null;

  // State for retroactive check-in date selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { threads } = useThreads();

  // Bidirectional hook - READ and WRITE
  // NEW SIGNATURE: (relationshipId, menteeUid, daysCount)
  const { timeline, loading, submitCheckIn } = useCheckIns(
    relationshipId,
    uid,
    7
  );

  const handleMessage = () => {
    // Find thread for this mentor
    const thread = threads.find((t) => t.otherUserId === mentorUid);

    // Always close the modal immediately
    close();

    if (!thread) {
      console.log("No thread found for this mentee/mentor");
      return;
    }

    // Wait for modal animation to complete
    setTimeout(() => {
      router.push({
        pathname: "/message-thread",
        params: {
          threadId: thread.id,
        },
      });
    }, 300);
  };

  const handleSubmitCheckIn = async (status: any, note: string) => {
    if (!uid) return;

    try {
      // Use selectedDate if retroactive, otherwise use today
      const dateToSubmit = selectedDate || getTodayDateString();
      await submitCheckIn(dateToSubmit, status, note, uid);
      console.log("Check-in submitted successfully for:", dateToSubmit);

      // Reset selected date back to today mode
      setSelectedDate(null);

      // Don't close the modal - let user see the update
    } catch (error) {
      console.error("Error submitting check-in:", error);
      // TODO: Show error toast to user
    }
  };

  const handleFillMissing = (date: string) => {
    // User clicked a missing day - set it as selected date
    setSelectedDate(date);
    console.log("Fill missing day:", date);
  };

  const handleSelectFilled = () => {
    // User clicked a filled day - reset to today mode
    setSelectedDate(null);
    console.log("Selected filled day - reset to today");
  };

  const defaultButtonContent = (
    <View style={styles.buttonContent}>
      <MentorCardContent
        mentorUid={mentorUid}
        streak={streak}
        checkInStatus={checkInStatus}
        mentorTimezone={mentorTimezone}
        showExpandIcon={true}
      />
    </View>
  );

  const buttonContent = customButtonContent || defaultButtonContent;

  const modalContent = (
    <View style={styles.screenContainer}>
      <View style={[styles.screenWrapper, styles.screenBackground]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 42, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Header Tile */}
          <AccountabilityModalHeader
            uid={mentorUid}
            timezone={mentorTimezone} // PASS IT DOWN (note: prop name is menteeTimezone in the component)
            actionButtons={[
              {
                icon: "message.fill",
                label: "Message",
                onPress: handleMessage,
              },
            ]}
          />

          {/* Check-In Section */}
          <CheckInSection
            checkInStatus={checkInStatus}
            onSubmit={handleSubmitCheckIn}
            selectedDate={selectedDate}
          />

          {/* Recent Check-Ins Section */}
          {!loading && timeline.length > 0 && (
            <RecentCheckInsSection
              checkIns={timeline}
              timezone={mentorTimezone}
              onFillMissing={handleFillMissing}
              onSelectFilled={handleSelectFilled}
            />
          )}
          <EndRelationship
            relationshipId={relationshipId}
            role="mentee" // You are the MENTEE in this relationship (they are your mentor)
            colors={colors}
            onMessage={handleMessage}
            onComplete={() => close()}
          />
        </ScrollView>
      </View>
    </View>
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
  buttonContent: {
    padding: 0,
  },
  screenContainer: {
    flex: 1,
    position: "relative",
  },
  screenWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  screenBackground: {
    backgroundColor: "transparent",
    borderRadius: 28,
    overflow: "hidden",
  },
});
