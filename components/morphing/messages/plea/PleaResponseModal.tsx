// components/messages/PleaResponseModal.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { auth, db } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { PleaData } from "./PleaCard";
import { PleaCardContent } from "./PleaCardContent";
import { PleaResponseConfirmationScreen } from "./PleaResponseConfirmationScreen";
import { PleaResponseInputScreen } from "./PleaResponseInputScreen";

interface PleaResponseModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  plea: PleaData | null;
  now: Date;
}

type ScreenType = "input" | "confirmation";

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
  const [screen, setScreen] = useState<ScreenType>("input");
  const screenTransition = useSharedValue(0); // 0 = input, 1 = confirmation
  const [encouragementText, setEncouragementText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpenToChat, setIsOpenToChat] = useState(true); // Default to true

  // Reset on close
  useEffect(() => {
    if (!isVisible) {
      setTimeout(() => {
        setScreen("input");
        setEncouragementText("");
        setIsOpenToChat(true); // Reset to default
        screenTransition.value = 0;
      }, 200);
    }
  }, [isVisible, screenTransition]);

  // Animation for the two screens (slide L/R)
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
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }));

  const confirmationScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          screenTransition.value,
          [0, 1],
          [100, 0],
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
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }));

  if (!plea) return null;

  // Button content (keep same padding, border logic)
  const isUrgent =
    plea.encouragementCount === 0 && getHoursAgo(plea.createdAt, now) > 2;
  const buttonContent = <PleaCardContent plea={plea} now={now} />;

  // Send encouragement handler
  const handleSendEncouragement = async () => {
    if (!encouragementText.trim() || !auth.currentUser) return;
    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await addDoc(collection(db, "pleas", plea.id, "encouragements"), {
        helperUid: auth.currentUser.uid,
        message: encouragementText.trim(),
        openToChat: isOpenToChat,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      setEncouragementText("");
      // Animate to confirmation
      screenTransition.value = withTiming(1, { duration: 320 });
      setScreen("confirmation");
      setTimeout(() => {
        close?.();
        // Reset will run after close due to effect above
      }, 2000);
    } catch (error) {
      console.error("Error sending encouragement:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Modal content is a layered animated container
  const modalContent = (
    <View style={{ flex: 1, minHeight: 420 }}>
      {/* Input Screen */}
      <Animated.View style={[styles.animatedScreen, inputScreenStyle]}>
        <PleaResponseInputScreen
          plea={plea}
          now={now}
          encouragementText={encouragementText}
          onChangeEncouragementText={setEncouragementText}
          isSending={isSending}
          onSend={handleSendEncouragement}
          isOpenToChat={isOpenToChat}
          onToggleOpenToChat={setIsOpenToChat}
        />
      </Animated.View>
      {/* Confirmation Screen */}
      <Animated.View style={[styles.animatedScreen, confirmationScreenStyle]}>
        <PleaResponseConfirmationScreen />
      </Animated.View>
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
  modalContainer: {
    flex: 1,
  },
  animatedScreen: {
    flex: 1,
    minHeight: 420,
    // This keeps scroll/padding matching original modal
  },
});
