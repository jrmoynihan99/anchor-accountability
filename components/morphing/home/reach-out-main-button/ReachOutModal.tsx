// components/morphing/home/reach-out-main-button/ReachOutModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
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
import { ReachOutPendingScreen } from "./ReachOutPendingScreen";
import { ReachOutRejectedScreen } from "./ReachOutRejectedScreen";

interface ReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  ctaButtonContent?: React.ReactNode;
}

type ScreenType = "input" | "pending" | "confirmation" | "rejected";

export function ReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  ctaButtonContent,
}: ReachOutModalProps) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("input");
  const [contextMessage, setContextMessage] = useState("");
  const [currentPleaId, setCurrentPleaId] = useState<string | null>(null);
  const screenTransition = useSharedValue(0);
  const { colors, effectiveTheme } = useTheme();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Reset modal state when closed
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentScreen("input");
        setContextMessage("");
        setCurrentPleaId(null);
        screenTransition.value = 0;
        // Clean up any existing listener
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

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

  const handleSendMessage = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in");
      return;
    }

    try {
      // First transition to pending screen
      transitionToScreen("pending");

      // Create the plea document
      const docRef = await addDoc(collection(db, "pleas"), {
        uid: user.uid,
        message: contextMessage || "",
        createdAt: serverTimestamp(),
        status: "pending",
      });

      setCurrentPleaId(docRef.id);

      // Set up real-time listener for status changes
      const unsubscribe = onSnapshot(doc(db, "pleas", docRef.id), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const status = data.status;

          console.log(`Plea ${docRef.id} status updated to: ${status}`);

          if (status === "approved") {
            transitionToScreen("confirmation");
          } else if (status === "rejected") {
            transitionToScreen("rejected");
          }
          // If still "pending", stay on pending screen
        }
      });

      // Store the unsubscribe function
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Error sending plea:", error);
      // On error, go back to input screen
      transitionToScreen("input");
    }
  };

  const handleRetry = () => {
    // Clean up current listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setCurrentPleaId(null);
    screenTransition.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setCurrentScreen("input");
  };

  // Animation styles - back to your original simple approach
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

  // Render the appropriate screen based on currentScreen state
  const renderActiveScreen = () => {
    switch (currentScreen) {
      case "pending":
        return <ReachOutPendingScreen />;
      case "confirmation":
        return <ReachOutConfirmationScreen onClose={close} />;
      case "rejected":
        return (
          <ReachOutRejectedScreen
            onClose={close}
            onRetry={handleRetry}
            originalMessage={contextMessage}
          />
        );
      default:
        return null;
    }
  };

  // Default button content for morphing
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

  // Modal content with all screens
  const modalContent = (
    <View style={styles.screenContainer}>
      {/* Input Screen - Always rendered */}
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

      {/* Active Screen - Conditionally rendered based on currentScreen */}
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
