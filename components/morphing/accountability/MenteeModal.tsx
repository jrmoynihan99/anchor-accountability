import { useTheme } from "@/hooks/ThemeContext";
import { useCheckIns } from "@/hooks/useCheckIns";
import { useThreads } from "@/hooks/useThreads";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { AccountabilityModalHeader } from "./AccountabilityModalHeader";
import { CheckInStatus } from "./accountabilityUtils";
import { LatestCheckInSection } from "./LatestCheckInSection";
import { MenteeCardContent } from "./MenteeCardContent";
import { RecentCheckInsSection } from "./RecentCheckInsSection";

interface MenteeModalProps {
  menteeUid: string;
  recoveryStreak: number;
  checkInStreak: number;
  checkInStatus: CheckInStatus;
  relationshipId: string;
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function MenteeModal({
  menteeUid,
  recoveryStreak,
  checkInStreak,
  checkInStatus,
  relationshipId,
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: MenteeModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Bidirectional hook - READ and WRITE
  const { checkIns, timeline, loading } = useCheckIns(relationshipId, 7);

  const { threads } = useThreads();

  // Get the most recent check-in (if exists and not missing)
  const latestCheckIn =
    checkIns.length > 0 && !("isMissing" in checkIns[0])
      ? checkIns[0]
      : undefined;

  const handleMessage = () => {
    // Find thread for this mentee
    const thread = threads.find((t) => t.otherUserId === menteeUid);

    // Always close the modal immediately
    close();

    if (!thread) {
      console.log("No thread found for this mentee");
      return;
    }

    // Wait for modal animation to complete
    setTimeout(() => {
      router.push({
        pathname: "/message-thread",
        params: { threadId: thread.id },
      });
    }, 300); // adjust if your morph animation is longer
  };

  const handleReminder = () => {
    console.log("Send reminder to mentee");
    // TODO: Implement push notification or in-app notification
  };

  const buttonContent = (
    <View style={styles.buttonContent}>
      <MenteeCardContent
        menteeUid={menteeUid}
        recoveryStreak={recoveryStreak}
        checkInStreak={checkInStreak}
        checkInStatus={checkInStatus}
        showExpandIcon={true}
        onMessage={handleMessage}
      />
    </View>
  );

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
            uid={menteeUid}
            actionButtons={[
              {
                icon: "message.fill",
                label: "Message",
                onPress: handleMessage,
              },
            ]}
          />

          {/* Latest Check-In Section */}
          <LatestCheckInSection
            checkInStatus={checkInStatus}
            latestCheckIn={latestCheckIn}
            onRemind={handleReminder}
          />

          {/* Recent Check-Ins Section */}
          {!loading && timeline.length > 0 && (
            <RecentCheckInsSection checkIns={timeline} />
          )}
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
