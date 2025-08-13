// ReachOutModal.tsx - Refactored to use ThemedText
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { ReachOutConfirmationScreen } from "./ReachOutConfirmationScreen";
import { ReachOutInputScreen } from "./ReachOutInputScreen";

interface ReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  onGuidedPrayer?: () => void;
  onReadScripture?: () => void; // Add this new prop
}

type ScreenType = "input" | "confirmation";

export function ReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  onGuidedPrayer,
  onReadScripture, // Add this parameter
}: ReachOutModalProps) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("input");
  const [contextMessage, setContextMessage] = useState("");
  const screenTransition = useSharedValue(0); // 0 = input, 1 = confirmation
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  // Reset state only when modal becomes invisible
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentScreen("input");
        setContextMessage("");
        screenTransition.value = 0;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle sending the message
  const handleSendMessage = () => {
    // TODO: Implement actual sending logic here
    console.log("Sending message:", contextMessage);

    // Animate to confirmation screen
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });

    setCurrentScreen("confirmation");
  };

  // Screen transition animations
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

  const confirmationScreenStyle = useAnimatedStyle(() => ({
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

  // Button content (what shows during the transition)
  const buttonContent = (
    <View style={styles.pillButtonTouchable}>
      <View style={styles.pillTextContainer}>
        <Ionicons
          name="shield-checkmark"
          size={20}
          color={colors.white}
          style={{ marginRight: 8 }}
        />
        <ThemedText
          type="buttonXLarge"
          lightColor={colors.white}
          darkColor={colors.white}
        >
          Reach Out
        </ThemedText>
      </View>
      <ThemedText
        type="body"
        lightColor={colors.whiteTranslucent}
        darkColor={colors.whiteTranslucent}
        style={{ letterSpacing: 0.2 }}
      >
        Get anonymous help
      </ThemedText>
    </View>
  );

  // Modal content
  const modalContent = (
    <View style={styles.screenContainer}>
      {/* Input Screen */}
      <Animated.View
        style={[
          styles.screenWrapper,
          styles.screenBackground,
          inputScreenStyle,
        ]}
      >
        <ReachOutInputScreen
          contextMessage={contextMessage}
          onContextChange={setContextMessage}
          onSend={handleSendMessage}
        />
      </Animated.View>

      {/* Confirmation Screen */}
      <Animated.View
        style={[
          styles.screenWrapper,
          styles.screenBackground,
          confirmationScreenStyle,
        ]}
      >
        <ReachOutConfirmationScreen
          onClose={close}
          onGuidedPrayer={onGuidedPrayer}
          onReadScripture={onReadScripture} // Pass the new prop through
        />
      </Animated.View>
    </View>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={theme ?? "dark"}
      backgroundColor={colors.tint}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.1]} // Custom range for ReachOut
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  pillButtonTouchable: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  pillTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
