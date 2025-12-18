import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { useAccountability } from "@/context/AccountabilityContext";
import { useThreads } from "@/hooks/useThreads";
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { EmptyMenteeCard } from "../morphing/accountability/EmptyMenteeCard";
import { MenteeCard } from "../morphing/accountability/MenteeCard";
import { MenteeModal } from "../morphing/accountability/MenteeModal";

const MAX_MENTEES = 3;

interface YoureSupportingListProps {
  openMenteeRelationship?: string;
}

export function YoureSupportingList({
  openMenteeRelationship,
}: YoureSupportingListProps) {
  const { mentees, loading } = useAccountability();
  const { threads } = useThreads();
  const currentUid = auth.currentUser?.uid;

  // Store refs to modal controls for each mentee
  const modalRefs = useRef<{
    [key: string]: { open: () => void };
  }>({});

  const handleMessage = (menteeUid: string) => {
    if (!currentUid) return;

    // find the thread where this mentee is the other user
    const thread = threads.find(
      (t) =>
        (t.userA === currentUid && t.userB === menteeUid) ||
        (t.userB === currentUid && t.userA === menteeUid)
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

  // Auto-open modal if openMenteeRelationship is provided (from notification)
  useEffect(() => {
    if (openMenteeRelationship && mentees.length > 0 && !loading) {
      const targetMentee = mentees.find((m) => m.id === openMenteeRelationship);
      if (targetMentee) {
        // Small delay to ensure the screen is fully rendered and refs are set
        setTimeout(() => {
          const controls = modalRefs.current[openMenteeRelationship];
          if (controls) {
            controls.open();
            // Clear the param so it doesn't re-trigger
            router.setParams({ openMenteeRelationship: undefined });
          }
        }, 500);
      }
    }
  }, [openMenteeRelationship, mentees, loading]);

  // Calculate how many empty slots to show
  const emptySlots = MAX_MENTEES - mentees.length;

  return (
    <View>
      {/* Render actual mentee cards */}
      {mentees.map((mentee) => (
        <ButtonModalTransitionBridge
          key={mentee.id}
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
            modalRefs.current[mentee.id] = { open };

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

            return (
              <>
                <MenteeCard
                  menteeUid={mentee.menteeUid}
                  recoveryStreak={mentee.streak}
                  checkInStreak={45}
                  checkInStatus={mentee.checkInStatus}
                  menteeTimezone={mentee.menteeTimezone}
                  onMessage={() => handleMessage(mentee.menteeUid)}
                  buttonRef={buttonRef}
                  style={buttonAnimatedStyle}
                  onPress={open}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                />
                <MenteeModal
                  menteeUid={mentee.menteeUid}
                  recoveryStreak={mentee.streak}
                  checkInStreak={45}
                  relationshipId={mentee.id}
                  isVisible={isModalVisible}
                  progress={progress}
                  modalAnimatedStyle={modalAnimatedStyle}
                  close={close}
                />
              </>
            );
          }}
        </ButtonModalTransitionBridge>
      ))}

      {/* Render empty state cards for remaining slots */}
      {Array.from({ length: emptySlots }).map((_, index) => (
        <EmptyMenteeCard
          key={`empty-${index}`}
          position={mentees.length + index + 1}
        />
      ))}
    </View>
  );
}
