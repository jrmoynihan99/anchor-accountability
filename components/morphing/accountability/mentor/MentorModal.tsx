import { useTheme } from "@/context/ThemeContext";
import {
  getTodayDateString,
  TriggerType,
  useCheckIns,
} from "@/hooks/accountability/useCheckIns";
import { useThreads } from "@/hooks/messages/useThreads";
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { AccountabilityModalHeader } from "../AccountabilityModalHeader";
import { CheckInStatus } from "../accountabilityUtils";
import { CheckInSection } from "../CheckInSection";
import { EndRelationship } from "../EndRelationship";
import { RecentCheckInsSection } from "../RecentCheckInsSection";
import { MentorCardContent } from "./MentorCardContent";

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
  onMessage?: () => void; // Optional message handler override
}

export function MentorModal({
  mentorUid,
  streak,
  checkInStatus,
  mentorTimezone,
  relationshipId,
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  buttonContent: customButtonContent, // Optional override
  onMessage, // Optional override
}: MentorModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const uid = auth.currentUser?.uid || null;

  // State for retroactive check-in date selection
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { threads } = useThreads();

  // Bidirectional hook - READ and WRITE
  const { timeline, loading, submitCheckIn } = useCheckIns(
    relationshipId,
    uid,
    7,
  );

  const handleMessage =
    onMessage ||
    (() => {
      // Default behavior: navigate to thread
      const thread = threads.find((t) => t.otherUserId === mentorUid);

      close();

      if (!thread) {
        return;
      }

      setTimeout(() => {
        router.push({
          pathname: "/message-thread",
          params: {
            threadId: thread.id,
            threadName: thread.otherUserName,
            otherUserId: thread.otherUserId,
            isNewThread: "false",
          },
        });
      }, 300);
    });

  const handleSubmitCheckIn = async (
    temptationLevel: number,
    triggers: TriggerType[] | undefined,
    note: string,
  ) => {
    if (!uid) return;

    try {
      // Use selectedDate if retroactive, otherwise use today
      const dateToSubmit = selectedDate || getTodayDateString();
      await submitCheckIn(dateToSubmit, temptationLevel, triggers, note, uid);

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
  };

  const handleSelectFilled = () => {
    // User clicked a filled day - reset to today mode
    setSelectedDate(null);
  };

  // Determine button content
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

  // If custom button content provided (e.g., partner button from MessageInput), use it directly
  // Otherwise, wrap default card content in container
  const buttonContent = customButtonContent || defaultButtonContent;

  const modalContent = (
    <View style={styles.screenContainer}>
      <View style={[styles.screenWrapper, styles.screenBackground]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 42, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          removeClippedSubviews={true}
        >
          {/* Header Tile */}
          <AccountabilityModalHeader
            uid={mentorUid}
            timezone={mentorTimezone}
            role="mentor" // NEW: This user is YOUR MENTOR
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
      buttonContentPadding={customButtonContent ? 0 : 20} // No padding for custom button, padding for card
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    padding: 0,
    width: "100%",
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
