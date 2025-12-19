import { useTheme } from "@/context/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { useCheckIns } from "@/hooks/useCheckIns";
import { useThreads } from "@/hooks/useThreads";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { AccountabilityModalHeader } from "../AccountabilityModalHeader";
import { EndRelationship } from "../EndRelationship";
import { LatestCheckInSection } from "../LatestCheckInSection";
import { RecentCheckInsSection } from "../RecentCheckInsSection";
import { MenteeCardContent } from "./MenteeCardContent";

interface MenteeModalProps {
  menteeUid: string;
  recoveryStreak: number;
  checkInStreak: number;
  relationshipId: string;
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  buttonContent?: React.ReactNode; // Optional override
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
  buttonContent: customButtonContent, // Optional override
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
      return;
    }

    setTimeout(() => {
      router.push({
        pathname: "/message-thread",
        params: {
          threadId: thread.id,
        },
      });
    }, 300);
  };

  const defaultButtonContent = (
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
          <EndRelationship
            relationshipId={relationshipId}
            role="mentor" // You are the MENTEE in this relationship (they are your mentor)
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
