// components/messages/PleaResponseModal.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { auth, db } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { PleaData } from "./PleaCard";
import { PleaCardContent } from "./PleaCardContent";
import { PleaResponseConfirmationScreen } from "./PleaResponseConfirmationScreen";
import { PleaResponseInputScreen } from "./PleaResponseInputScreen";
import { PleaResponsePendingScreen } from "./PleaResponsePendingScreen";
import { PleaResponseRejectedScreen } from "./PleaResponseRejectedScreen";

interface PleaResponseModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  plea: PleaData | null;
  now: Date;
}

type ScreenType = "input" | "pending" | "confirmation" | "rejected";

export function PleaResponseModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  plea,
  now,
}: PleaResponseModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Screen logic
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("input");
  const screenTransition = useSharedValue(0); // 0 = input, 1 = other screens
  const [encouragementText, setEncouragementText] = useState("");
  const [isOpenToChat, setIsOpenToChat] = useState(true); // Default to true
  const [currentEncouragementId, setCurrentEncouragementId] = useState<
    string | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>(
    undefined
  );
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Reset modal state when closed
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentScreen("input");
        setEncouragementText("");
        setIsOpenToChat(true);
        setCurrentEncouragementId(null);
        setRejectionReason(undefined);
        screenTransition.value = 0;
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, screenTransition]);

  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const transitionToScreen = (screen: ScreenType) => {
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setCurrentScreen(screen);
  };

  // Send encouragement handler
  const handleSendEncouragement = async () => {
    Keyboard.dismiss();
    if (!encouragementText.trim() || !auth.currentUser || !plea) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      transitionToScreen("pending");
      const docRef = await addDoc(
        collection(db, "pleas", plea.id, "encouragements"),
        {
          helperUid: auth.currentUser.uid,
          message: encouragementText.trim(),
          openToChat: isOpenToChat,
          createdAt: serverTimestamp(),
          status: "pending",
        }
      );
      setCurrentEncouragementId(docRef.id);

      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const status = data.status;
        if (status === "approved") {
          transitionToScreen("confirmation");
          // Auto-close after showing confirmation for 2 seconds
          setTimeout(() => {
            close?.();
          }, 2000);
        } else if (status === "rejected") {
          // Capture rejection reason if available
          setRejectionReason(data.rejectionReason || undefined);
          transitionToScreen("rejected");
        }
      });
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Error sending encouragement:", error);
      transitionToScreen("input");
    }
  };

  const handleRetry = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setCurrentEncouragementId(null);
    setRejectionReason(undefined);
    screenTransition.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setCurrentScreen("input");
  };

  // --- Animations for the two-layer screen swap ---
  const inputScreenStyle = useAnimatedStyle(() => ({
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

  const activeScreenStyle = useAnimatedStyle(() => ({
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

  if (!plea) return null;

  // Button content (keep same padding, border logic)
  const isUrgent = plea.encouragementCount === 0;

  const buttonContent = <PleaCardContent plea={plea} now={now} />;

  // --- Screens ---
  const renderActiveScreen = () => {
    switch (currentScreen) {
      case "pending":
        return <PleaResponsePendingScreen />;
      case "confirmation":
        return <PleaResponseConfirmationScreen />;
      case "rejected":
        return (
          <PleaResponseRejectedScreen
            onClose={close}
            onRetry={handleRetry}
            originalMessage={encouragementText}
            rejectionReason={rejectionReason}
          />
        );
      default:
        return null;
    }
  };

  // Modal content is a layered animated container
  const modalContent = (
    <View style={styles.screenContainer}>
      <Animated.View
        style={[
          styles.screenWrapper,
          styles.screenBackground,
          inputScreenStyle,
        ]}
      >
        <PleaResponseInputScreen
          plea={plea}
          now={now}
          encouragementText={encouragementText}
          onChangeEncouragementText={setEncouragementText}
          isSending={false}
          onSend={handleSendEncouragement}
          isOpenToChat={isOpenToChat}
          onToggleOpenToChat={setIsOpenToChat}
        />
      </Animated.View>

      {currentScreen !== "input" && (
        <Animated.View
          style={[
            styles.screenWrapper,
            styles.screenBackground,
            activeScreenStyle,
          ]}
        >
          {renderActiveScreen()}
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
      buttonBackgroundColor={colors.cardBackground}
      buttonContentPadding={20}
      buttonBorderWidth={isUrgent ? 1.5 : 1}
      buttonBorderColor={isUrgent ? colors.error : "transparent"}
      buttonBorderRadius={16}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.15]}
    >
      {modalContent}
    </BaseModal>
  );
}

// Helper
function getHoursAgo(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
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
    borderRadius: 28,
    overflow: "hidden",
  },
});
