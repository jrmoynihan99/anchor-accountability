// components/morphing/home/reach-out-main-button/ReachOutModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { useMyReachOuts } from "@/hooks/useMyReachOuts";
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
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { ReachOutConfirmationScreen } from "./ReachOutConfirmationScreen";
import { ReachOutInputScreen } from "./ReachOutInputScreen";
import { ReachOutPendingScreen } from "./ReachOutPendingScreen";
import { ReachOutRateLimitedScreen } from "./ReachOutRateLimitedScreen";
import { ReachOutRejectedScreen } from "./ReachOutRejectedScreen";

interface ReachOutModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;

  /** If provided, overrides any built-in button content (kept for backward-compat). */
  ctaButtonContent?: React.ReactNode;

  /** Choose built-in morph target if you don't pass ctaButtonContent. */
  buttonVariant?: "pill" | "circle";

  /** Circle variant knobs (ignored for pill): */
  buttonSize?: number; // default 70
  iconSize?: number; // default 38
  borderWidth?: number; // default 1
}

type ScreenType =
  | "input"
  | "pending"
  | "confirmation"
  | "rejected"
  | "rateLimited";

// --- Rate limit helper ---
function checkReachOutRateLimit(myReachOuts: any[]) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const recentReachOuts = myReachOuts.filter(
    (reachOut) => reachOut.createdAt >= fiveMinutesAgo
  );

  if (recentReachOuts.length >= 2) {
    const oldestRecent = recentReachOuts.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );
    const waitTimeMs =
      oldestRecent.createdAt.getTime() + 5 * 60 * 1000 - now.getTime();
    return { isRateLimited: true, waitTimeMs: Math.max(0, waitTimeMs) };
  }
  return { isRateLimited: false, waitTimeMs: 0 };
}

export function ReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  ctaButtonContent,
  buttonVariant = "pill",
  buttonSize = 70,
  iconSize = 38,
  borderWidth = 1,
}: ReachOutModalProps) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("input");
  const [contextMessage, setContextMessage] = useState("");
  const [currentPleaId, setCurrentPleaId] = useState<string | null>(null);
  const screenTransition = useSharedValue(0);
  const { colors, effectiveTheme } = useTheme();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { myReachOuts } = useMyReachOuts();

  // Check rate limit when modal opens
  useEffect(() => {
    if (isVisible) {
      const rateLimitInfo = checkReachOutRateLimit(myReachOuts);
      if (rateLimitInfo.isRateLimited) {
        setCurrentScreen("rateLimited");
        screenTransition.value = 1;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentScreen("input");
        setContextMessage("");
        setCurrentPleaId(null);
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

  const handleSendMessage = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in");
      return;
    }

    const hasMessage = contextMessage && contextMessage.trim();
    const initialStatus = hasMessage ? "pending" : "approved";

    try {
      if (hasMessage) {
        transitionToScreen("pending");
      } else {
        transitionToScreen("confirmation"); // Skip pending for blank messages
      }

      const docRef = await addDoc(collection(db, "pleas"), {
        uid: user.uid,
        message: contextMessage || "",
        createdAt: serverTimestamp(),
        status: initialStatus,
      });

      if (hasMessage) {
        // Only set up listener if we need to wait for approval
        setCurrentPleaId(docRef.id);
        const unsubscribe = onSnapshot(doc(db, "pleas", docRef.id), (snap) => {
          if (!snap.exists()) return;
          const status = snap.data().status;
          if (status === "approved") transitionToScreen("confirmation");
          else if (status === "rejected") transitionToScreen("rejected");
        });
        unsubscribeRef.current = unsubscribe;
      }
      // If no message, we already transitioned to confirmation above
    } catch (error) {
      console.error("Error sending plea:", error);
      transitionToScreen("input");
    }
  };

  const handleRetry = () => {
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

  // --- Built-in morph targets (used ONLY if ctaButtonContent is not provided) ---
  const PillCTAContent = (
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
        lightColor={colors.white}
        darkColor={colors.white}
        style={{ letterSpacing: 0.2 }}
      >
        Get anonymous help
      </ThemedText>
    </View>
  );

  const CircleCTAContent = (
    // Force the morph mount to be the exact rect of the real button.
    <View
      style={{
        width: buttonSize,
        height: buttonSize,
        alignSelf: "center", // <- center in any wider parent
        // No margin/padding here. Keep it a clean box.
      }}
      pointerEvents="none"
    >
      <View
        style={[
          styles.circleContainer,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: colors.tint,
            borderColor: colors.navBorder,
            borderWidth,
            shadowColor: colors.shadow,
            shadowOpacity: 0.35,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 5,
          },
        ]}
      >
        <Ionicons
          name="shield-checkmark"
          size={iconSize}
          color={colors.white}
        />
      </View>
    </View>
  );

  const builtInButtonContent =
    buttonVariant === "circle" ? CircleCTAContent : PillCTAContent;

  // --- Screens ---
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
      case "rateLimited": {
        const rateLimitInfo = checkReachOutRateLimit(myReachOuts);
        return (
          <ReachOutRateLimitedScreen
            waitTimeMs={rateLimitInfo.waitTimeMs}
            onClose={close}
            onTimeExpired={() => {
              screenTransition.value = withTiming(0, {
                duration: 300,
                easing: Easing.out(Easing.quad),
              });
              setCurrentScreen("input");
            }}
          />
        );
      }
      default:
        return null;
    }
  };

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
      buttonContent={ctaButtonContent || builtInButtonContent}
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
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
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
