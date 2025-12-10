import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { useCheckIns } from "@/hooks/useCheckIns";
import { useThreads } from "@/hooks/useThreads";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { AccountabilityModalHeader } from "./AccountabilityModalHeader";
import { LatestCheckInSection } from "./LatestCheckInSection";
import { MenteeCardContent } from "./MenteeCardContent";
import { RecentCheckInsSection } from "./RecentCheckInsSection";

interface MenteeModalProps {
  menteeUid: string;
  recoveryStreak: number;
  checkInStreak: number;
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
  relationshipId,
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: MenteeModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const { threads } = useThreads();
  const { mentees } = useAccountabilityRelationships();

  // Get relationship data for UI
  const relationship = mentees.find((m) => m.id === relationshipId);
  const checkInStatus = relationship?.checkInStatus || {
    text: "Loading...",
    icon: "clock.fill",
    colorKey: "textSecondary" as const,
    isOverdue: false,
    overdueText: null,
    hasCheckedInToday: false,
  };
  const menteeTimezone = relationship?.menteeTimezone;

  // Hook now auto-loads mentee timezone
  const { checkIns, timeline, loading, userTimezone } = useCheckIns(
    relationshipId,
    menteeUid,
    7
  );

  const latestCheckIn =
    checkIns.length > 0 && !("isMissing" in checkIns[0])
      ? checkIns[0]
      : undefined;

  const handleMessage = () => {
    const thread = threads.find((t) => t.otherUserId === menteeUid);
    close();

    if (!thread) {
      console.log("No thread found for this mentee");
      return;
    }

    setTimeout(() => {
      router.push({
        pathname: "/message-thread",
        params: { threadId: thread.id },
      });
    }, 300);
  };

  const handleReminder = () => {
    console.log("Send reminder to mentee");
    // TODO: Implement push notification
  };

  const buttonContent = (
    <View style={styles.buttonContent}>
      <MenteeCardContent
        menteeUid={menteeUid}
        recoveryStreak={recoveryStreak}
        checkInStreak={checkInStreak}
        checkInStatus={checkInStatus}
        menteeTimezone={menteeTimezone}
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
          <AccountabilityModalHeader
            uid={menteeUid}
            actionButtons={[
              {
                icon: "message.fill",
                label: "Message",
                onPress: handleMessage,
              },
            ]}
            timezone={userTimezone}
          />

          <LatestCheckInSection
            latestCheckIn={latestCheckIn}
            onMessage={handleMessage}
            userTimezone={userTimezone}
          />

          {!loading && timeline.length > 0 && (
            <RecentCheckInsSection
              checkIns={timeline}
              timezone={userTimezone}
            />
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
