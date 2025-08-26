// components/morphing/home/reach-out-main-button/ReachOutModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { ReachOutConfirmationScreen } from "./ReachOutConfirmationScreen";
import { ReachOutInputScreen } from "./ReachOutInputScreen";

interface ReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  onGuidedPrayer?: () => void;
  onReadScripture?: () => void;
  ctaButtonContent?: React.ReactNode; // NEW!
}

type ScreenType = "input" | "confirmation";

export function ReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  onGuidedPrayer,
  onReadScripture,
  ctaButtonContent,
}: ReachOutModalProps) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("input");
  const [contextMessage, setContextMessage] = useState("");
  const screenTransition = useSharedValue(0); // 0 = input, 1 = confirmation
  const { colors, effectiveTheme } = useTheme();

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

  const handleSendMessage = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in");
      return;
    }

    try {
      await addDoc(collection(db, "pleas"), {
        uid: user.uid,
        message: contextMessage || "",
        createdAt: serverTimestamp(),
        status: "pending",
      });

      screenTransition.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
      setCurrentScreen("confirmation");
    } catch (error) {
      console.error("Error sending plea:", error);
    }
  };

  // Animations
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

  // Default (pilled) button content for morphing
  const defaultButtonContent = (
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
          onReadScripture={onReadScripture}
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
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.tint}
      buttonContent={ctaButtonContent || defaultButtonContent}
      buttonContentOpacityRange={[0, 0.1]}
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
