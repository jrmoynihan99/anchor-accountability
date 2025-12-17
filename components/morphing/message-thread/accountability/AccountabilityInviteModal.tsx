// components/morphing/message-thread/accountability/AccountabilityInviteModal.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/hooks/ThemeContext";
import { auth } from "@/lib/firebase";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
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
    acknowledgeDeclinedInvite, // ✅ NEW
  } = useAccountability();
  const userHasMentor = !!mentor;

  // Track if user has read guidelines (separate for mentee and mentor flows)
  const [hasReadGuidelines, setHasReadGuidelines] = useState(false);
  const [hasReadMentorGuidelines, setHasReadMentorGuidelines] = useState(false);

  // ✅ SIMPLIFIED: Just track if there's a declined invite (no AsyncStorage needed)
  const [declinedInvite, setDeclinedInvite] = useState<any | null>(null);

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

    // ✅ SIMPLIFIED: Check if declined invite exists (no acknowledgment check needed)
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
  const screenTransition = useSharedValue(0);

  // Reset when modal closes
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentView(getInitialView());
        setHasReadGuidelines(false);
        setHasReadMentorGuidelines(false);
        screenTransition.value = 0;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Update view when inviteState or data changes
  useEffect(() => {
    if (isVisible && !loadingOtherUserData) {
      const newView = getInitialView();
      if (newView !== currentView) {
        transitionToView(newView);
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
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      setCurrentView(view);
      screenTransition.value = 0;
    }, 300);
  };

  // Mentee guidelines navigation (for sending invites)
  const handleNavigateToGuidelines = () => {
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      setCurrentView("guidelines");
      screenTransition.value = 0;
    }, 300);
  };

  const handleBackFromGuidelines = () => {
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      setCurrentView("default");
      screenTransition.value = 0;
    }, 300);
  };

  const handleConfirmGuidelines = () => {
    setHasReadGuidelines(true);
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      setCurrentView("default");
      screenTransition.value = 0;
    }, 300);
  };

  // Mentor guidelines navigation (for accepting invites)
  const handleNavigateToMentorGuidelines = () => {
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      setCurrentView("mentorGuidelines");
      screenTransition.value = 0;
    }, 300);
  };

  const handleBackFromMentorGuidelines = () => {
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      setCurrentView("received");
      screenTransition.value = 0;
    }, 300);
  };

  const handleConfirmMentorGuidelines = () => {
    setHasReadMentorGuidelines(true);
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      setCurrentView("received");
      screenTransition.value = 0;
    }, 300);
  };

  // ✅ SIMPLIFIED: Mark declined invite as acknowledged in Firestore
  const handleAcknowledgeDecline = async () => {
    if (!declinedInvite) return;

    try {
      // Mark the declined invite as acknowledged
      await acknowledgeDeclinedInvite(declinedInvite.id);

      // The listener will automatically filter it out (isAcknowledged: true)
      // Modal will transition to default view automatically via the useEffect
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

  // Animation styles
  const currentScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          screenTransition.value,
          [0, 1],
          [0, -100],
          "clamp"
        ),
      },
    ],
    opacity: interpolate(
      screenTransition.value,
      [0, 0.8, 1],
      [1, 0.3, 0],
      "clamp"
    ),
  }));

  const nextScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          screenTransition.value,
          [0, 1],
          [300, 0],
          "clamp"
        ),
      },
    ],
    opacity: interpolate(
      screenTransition.value,
      [0, 0.2, 1],
      [0, 1, 1],
      "clamp"
    ),
  }));

  // Render the appropriate view
  const renderView = (view: ViewType) => {
    const commonProps = {
      colors,
      otherUserId,
      threadName,
      onClose: close,
    };

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
      case "declined": // ✅ NEW
        return (
          <InviteDeclinedView
            {...commonProps}
            onAcknowledge={handleAcknowledgeDecline}
          />
        );
      default:
        return null;
    }
  };

  // Button content (the invite icon in its collapsed state)
  const buttonContent = (
    <View style={styles.buttonContent}>
      <IconSymbol
        name="person.badge.plus"
        size={24}
        color={colors.textSecondary}
      />
    </View>
  );

  const modalContent = (
    <View style={styles.screenContainer}>
      <Animated.View
        style={[
          styles.screenWrapper,
          styles.screenBackground,
          currentScreenStyle,
        ]}
      >
        {renderView(currentView)}
      </Animated.View>

      {screenTransition.value > 0 && (
        <Animated.View
          style={[
            styles.screenWrapper,
            styles.screenBackground,
            nextScreenStyle,
          ]}
        >
          {renderView(currentView)}
        </Animated.View>
      )}
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
      buttonBackgroundColor={colors.iconCircleSecondaryBackground}
      buttonContentPadding={0}
      buttonBorderRadius={20}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
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
    overflow: "hidden",
  },
});
