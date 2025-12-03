import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import React from "react";
import { View } from "react-native";
import { EmptyMenteeCard } from "../morphing/accountability/EmptyMenteeCard";
import { MenteeCard } from "../morphing/accountability/MenteeCard";
import { MenteeModal } from "../morphing/accountability/MenteeModal";

const MAX_MENTEES = 3;

export function YoureSupportingList() {
  const { mentees } = useAccountabilityRelationships();

  const handleRemind = (menteeUid: string) => {
    // TODO: Send reminder notification
    console.log("Send reminder to", menteeUid);
  };

  const handleMessage = (menteeUid: string) => {
    // TODO: Open DM
    console.log("Open DM with", menteeUid);
  };

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
          }) => (
            <>
              <MenteeCard
                menteeUid={mentee.menteeUid}
                recoveryStreak={mentee.streak}
                checkInStreak={45} // TODO: Get actual check-in streak from data
                lastCheckIn={mentee.lastCheckIn}
                onRemind={() => handleRemind(mentee.menteeUid)}
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
                checkInStreak={45} // TODO: Get actual check-in streak from data
                lastCheckIn={mentee.lastCheckIn}
                relationshipId={mentee.id}
                isVisible={isModalVisible}
                progress={progress}
                modalAnimatedStyle={modalAnimatedStyle}
                close={close}
              />
            </>
          )}
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
