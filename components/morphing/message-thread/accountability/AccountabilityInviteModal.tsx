// components/morphing/message-thread/accountability/AccountabilityInviteModal.tsx
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/lib/firebase";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { AccountabilityInviteButton } from "./AccountabilityInviteButton";
import { DefaultInviteView } from "./invite-views/DefaultInviteView";
import { GuidelinesView } from "./invite-views/GuidelinesView";
import { InviteDeclinedView } from "./invite-views/InviteDeclinedView";
import { InviteSentView } from "./invite-views/InviteSentView";
import { MentorGuidelinesView } from "./invite-views/MentorGuidelinesView";
import { ReceivedInviteView } from "./invite-views/ReceivedInviteView";
import { RestrictedMaxMenteesView } from "./invite-views/RestrictedMaxMenteesView";
import { RestrictedUserHasMentorView } from "./invite-views/RestrictedUserHasMentorView";

interface AccountabilityInviteModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  otherUserId: string;
  threadName: string;
  inviteState: "none" | "sent" | "received";
  pendingInvite?: any;
  otherUserMenteeCount: number;
  loadingOtherUserData: boolean;
  buttonVariant?:
    | "invite"
    | "partner"
    | "pending-sent"
    | "pending-received"
    | "declined";
}

type ViewType =
  | "default"
  | "guidelines"
  | "mentorGuidelines"
  | "userHasMentor"
  | "maxMentees"
  | "sent"
  | "received"
  | "declined";

// Helper function to determine animation direction
const getViewTransition = (
  fromView: ViewType | null,
  toView: ViewType,
  isFirstTransition: boolean
): {
  entering: any;
  exiting: any;
} => {
  // Define "back" transitions (views that should slide from left)
  // Define "back" transitions - map stores [from, to] pairs that are considered "back"
  const backTransitions = new Map<ViewType, ViewType>([
    ["guidelines", "default"], // guidelines → default is back
    ["mentorGuidelines", "received"], // mentorGuidelines → received is back
    ["sent", "default"], // sent → default is back (cancel invite)
  ]);

  const isBackTransition =
    fromView !== null && backTransitions.get(fromView) === toView;

  // First transition: both views animate (fade out old, slide in new)
  if (isFirstTransition) {
    if (isBackTransition) {
      return {
        entering: SlideInLeft.springify().damping(50).stiffness(300),
        exiting: SlideOutLeft.springify().damping(50).stiffness(300),
      };
    }
    return {
      entering: SlideInRight.springify().damping(50).stiffness(300),
      exiting: SlideOutRight.springify().damping(50).stiffness(300),
    };
  }

  if (isBackTransition) {
    return {
      entering: SlideInLeft.springify().damping(50).stiffness(300),
      exiting: SlideOutLeft.springify().damping(50).stiffness(300),
    };
  }

  // Default: forward transition (slide right to left)
  return {
    entering: SlideInRight.springify().damping(50).stiffness(300),
    exiting: SlideOutRight.springify().damping(50).stiffness(300),
  };
};

export function AccountabilityInviteModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  otherUserId,
  threadName,
  inviteState,
  pendingInvite,
  otherUserMenteeCount,
  loadingOtherUserData,
  buttonVariant = "invite",
}: AccountabilityInviteModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const currentUserId = auth.currentUser?.uid;

  // Get accountability functions and state from Context
  const {
    mentor,
    mentees,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    getDeclinedInviteWith,
    acknowledgeDeclinedInvite,
  } = useAccountability();
  const userHasMentor = !!mentor;

  // Track if user has read guidelines (separate for mentee and mentor flows)
  const [hasReadGuidelines, setHasReadGuidelines] = useState(false);
  const [hasReadMentorGuidelines, setHasReadMentorGuidelines] = useState(false);

  // Track declined invite
  const [declinedInvite, setDeclinedInvite] = useState<any | null>(null);

  // Track previous view for animation direction
  const [previousView, setPreviousView] = useState<ViewType | null>(null);

  // Track transition count (0 = initial render, 1 = first transition, 2+ = subsequent)
  const [transitionCount, setTransitionCount] = useState(0);

  // Check for declined invite - if it exists, show it (will be deleted on acknowledgment)
  useEffect(() => {
    if (!currentUserId || !otherUserId) {
      setDeclinedInvite(null);
      return;
    }

    const declined = getDeclinedInviteWith(otherUserId);
    setDeclinedInvite(declined);
  }, [currentUserId, otherUserId, getDeclinedInviteWith]);

  // Determine initial view based on props
  const getInitialView = (): ViewType => {
    // Don't determine view until we have other user's data
    if (loadingOtherUserData) return "default";

    // Check if declined invite exists
    if (declinedInvite) {
      return "declined";
    }

    if (inviteState === "sent") return "sent";
    if (inviteState === "received") {
      return "received";
    }

    // Check if OTHER USER has max mentees (can't invite them as my mentor)
    if (otherUserMenteeCount >= 3) return "maxMentees";

    // Check if current user has a mentor
    if (userHasMentor) return "userHasMentor";

    return "default";
  };

  const [currentView, setCurrentView] = useState<ViewType>(getInitialView());

  // Reset when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      // When opening, reset to initial view without animation
      setCurrentView(getInitialView());
      setTransitionCount(0);
      setPreviousView(null);
    } else {
      // When closing, reset everything immediately (no delay)
      setHasReadGuidelines(false);
      setHasReadMentorGuidelines(false);
      setTransitionCount(0);
      setPreviousView(null);
    }
  }, [isVisible]);

  // Update view when inviteState or data changes
  useEffect(() => {
    if (isVisible && !loadingOtherUserData) {
      const newView = getInitialView();
      if (newView !== currentView) {
        setPreviousView(currentView);
        setCurrentView(newView);
        setTransitionCount((prev) => prev + 1);
      }
    }
  }, [
    inviteState,
    userHasMentor,
    mentees.length,
    otherUserMenteeCount,
    loadingOtherUserData,
    isVisible,
    declinedInvite,
  ]);

  const transitionToView = (view: ViewType) => {
    setPreviousView(currentView);
    setCurrentView(view);
    setTransitionCount((prev) => prev + 1);
  };

  // Navigation handlers - all just call transitionToView
  const handleNavigateToGuidelines = () => transitionToView("guidelines");
  const handleBackFromGuidelines = () => transitionToView("default");
  const handleConfirmGuidelines = () => {
    setHasReadGuidelines(true);
    transitionToView("default");
  };

  const handleNavigateToMentorGuidelines = () =>
    transitionToView("mentorGuidelines");
  const handleBackFromMentorGuidelines = () => transitionToView("received");
  const handleConfirmMentorGuidelines = () => {
    setHasReadMentorGuidelines(true);
    transitionToView("received");
  };

  // Mark declined invite as acknowledged in Firestore
  const handleAcknowledgeDecline = async () => {
    if (!declinedInvite) return;

    try {
      await acknowledgeDeclinedInvite(declinedInvite.id);
      // Listener will automatically filter it out (isAcknowledged: true)
    } catch (error) {
      console.error("Error acknowledging declined invite:", error);
    }
  };

  // Handlers that will be passed to child components
  const handleSendInvite = async () => {
    if (!currentUserId) return;
    await sendInvite(otherUserId);
    transitionToView("sent");
  };

  const handleCancelInvite = async () => {
    if (!pendingInvite) return;
    await cancelInvite(pendingInvite.id);
    transitionToView("default");
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    await acceptInvite(pendingInvite.id);
    close();
  };

  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;
    await declineInvite(pendingInvite.id);
    close();
  };

  // Wrapper for close that acknowledges declined invite if needed
  const handleClose = (velocity?: number) => {
    // If we're currently showing the declined view, acknowledge before closing
    if (currentView === "declined" && declinedInvite) {
      handleAcknowledgeDecline();
    }
    close(velocity);
  };

  // Render the appropriate view with animations
  const renderView = (view: ViewType) => {
    const commonProps = {
      colors,
      otherUserId,
      threadName,
      onClose: handleClose,
    };

    // Always get the exit animation for the current view
    // This ensures the view knows how to exit even if it was the initial view
    const { entering, exiting } = (() => {
      if (transitionCount === 0) {
        // Initial render: no entering animation, but define exit animation for later
        // Default view exits left (forward), guidelines exits right (back)
        const exitsToRight =
          view === "guidelines" || view === "mentorGuidelines";
        return {
          entering: undefined,
          exiting: exitsToRight
            ? SlideOutRight.springify().damping(50).stiffness(300)
            : SlideOutLeft.springify().damping(50).stiffness(300),
        };
      }

      // All transitions after initial render
      return getViewTransition(previousView, view, transitionCount === 1);
    })();

    // Determine which view component to render
    const ViewContent = () => {
      switch (view) {
        case "default":
          return (
            <DefaultInviteView
              {...commonProps}
              onSendInvite={handleSendInvite}
              onTransitionToRestricted={(type) => {
                if (type === "hasMentor") transitionToView("userHasMentor");
                if (type === "maxMentees") transitionToView("maxMentees");
              }}
              onNavigateToGuidelines={handleNavigateToGuidelines}
              hasReadGuidelines={hasReadGuidelines}
            />
          );
        case "guidelines":
          return (
            <GuidelinesView
              {...commonProps}
              onBackPress={handleBackFromGuidelines}
              onConfirm={handleConfirmGuidelines}
            />
          );
        case "mentorGuidelines":
          return (
            <MentorGuidelinesView
              {...commonProps}
              onBackPress={handleBackFromMentorGuidelines}
              onConfirm={handleConfirmMentorGuidelines}
            />
          );
        case "userHasMentor":
          return <RestrictedUserHasMentorView {...commonProps} />;
        case "maxMentees":
          return <RestrictedMaxMenteesView {...commonProps} />;
        case "sent":
          return (
            <InviteSentView
              {...commonProps}
              onCancelInvite={handleCancelInvite}
            />
          );
        case "received":
          return (
            <ReceivedInviteView
              {...commonProps}
              onAcceptInvite={handleAcceptInvite}
              onDeclineInvite={handleDeclineInvite}
              onNavigateToGuidelines={handleNavigateToMentorGuidelines}
              hasReadGuidelines={hasReadMentorGuidelines}
            />
          );
        case "declined":
          return <InviteDeclinedView {...commonProps} />;
        default:
          return null;
      }
    };

    return (
      <Animated.View
        key={view}
        entering={entering}
        exiting={exiting}
        style={StyleSheet.absoluteFill}
      >
        <ViewContent />
      </Animated.View>
    );
  };

  // Dynamic button content based on variant
  const buttonContent = (
    <AccountabilityInviteButton variant={buttonVariant} colors={colors} />
  );

  const modalContent = (
    <View style={styles.screenContainer}>
      <View style={[styles.screenWrapper, styles.screenBackground]}>
        {renderView(currentView)}
      </View>
    </View>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={handleClose}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.iconCircleSecondaryBackground}
      buttonContentPadding={0}
      buttonBorderRadius={23}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
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
    overflow: "hidden",
  },
});
