import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { BlurView } from "expo-blur"; // <-- BLUR
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SHEET_HEIGHT = 520;

interface RejectionModalProps {
  isVisible: boolean;
  close: () => void;
  type?: "plea" | "post";
  message?: string;
  reason?: string;
}

export function RejectionModal({
  isVisible,
  close,
  type,
  message,
  reason,
}: RejectionModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Keeps Modal mounted until animation finishes
  const [internalVisible, setInternalVisible] = useState(false);
  const translateY = useSharedValue(SHEET_HEIGHT);

  // Track if closing animation is running to prevent double close
  const closing = useRef(false);

  // Animate in/out on prop change
  useEffect(() => {
    if (isVisible) {
      setInternalVisible(true);
      closing.current = false;
      translateY.value = withTiming(0, {
        duration: 340,
        easing: Easing.out(Easing.cubic),
      });
    } else if (!closing.current && internalVisible) {
      // start closing only if visible and not already closing
      closing.current = true;
      translateY.value = withTiming(
        SHEET_HEIGHT,
        { duration: 240, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setInternalVisible)(false);
        }
      );
    }
  }, [isVisible]);

  // Clean up closing flag if internalVisible is set to false (unmounted)
  useEffect(() => {
    if (!internalVisible) {
      closing.current = false;
    }
  }, [internalVisible]);

  // Drag-to-dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 600) {
        // Start closing animation (if not already closing)
        if (!closing.current) {
          closing.current = true;
          translateY.value = withTiming(
            SHEET_HEIGHT,
            { duration: 200 },
            (finished) => {
              if (finished) runOnJS(setInternalVisible)(false);
              if (finished) runOnJS(close)();
            }
          );
        }
      } else {
        // Snap back
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // If not visible, don't render (guaranteed after close animation)
  if (!internalVisible) return null;

  // Modal content utils
  const getTitle = () => {
    if (type === "plea") return "Your Plea Was Not Approved";
    if (type === "post") return "Your Community Post Was Not Approved";
    return "Content Not Approved";
  };

  const getDefaultReason = () => {
    if (type === "plea") {
      return "Your additional context was flagged by our automated moderation system. Please make sure your message is sincere, relevant to your struggle, and free of any hateful, spammy, or inappropriate language.";
    }
    if (type === "post") {
      return "Your post was flagged by our automated moderation system. Please make sure your post is respectful, on-topic, and free of any trolling, hate speech, or spam.";
    }
    return "Your content was flagged by our moderation system. Please try editing it and submitting again.";
  };

  // Handler for pressing X button or CTA button
  const handleClose = () => {
    if (!closing.current) {
      closing.current = true;
      // Animate out, then call parent close after animation (for controller state)
      translateY.value = withTiming(
        SHEET_HEIGHT,
        { duration: 220, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setInternalVisible)(false);
          if (finished) runOnJS(close)();
        }
      );
    }
  };

  return (
    <Modal
      visible={internalVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Dim backdrop - still needed for touch to close */}
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Blurred overlay */}
      <BlurView
        intensity={24}
        tint={effectiveTheme === "dark" ? "dark" : "light"}
        style={[StyleSheet.absoluteFill, { backgroundColor: "#0006" }]}
      />

      {/* Bottom Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
              shadowColor: colors.shadow,
            },
            animatedSheetStyle,
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: colors.closeButtonBackground },
            ]}
            onPress={handleClose}
            hitSlop={16}
            activeOpacity={0.8}
          >
            <IconSymbol name="xmark" size={18} color={colors.closeButtonText} />
          </TouchableOpacity>

          {/* Drag indicator */}
          <View
            style={[
              styles.dragIndicator,
              { backgroundColor: colors.dragIndicator },
            ]}
          />

          {/* Modal Content */}
          <View style={styles.contentContainer}>
            <ThemedText
              type="title"
              style={{
                textAlign: "center",
                color: colors.text,
                marginBottom: 10,
              }}
            >
              {getTitle()}
            </ThemedText>
            <ThemedText
              type="body"
              style={{
                textAlign: "center",
                color: colors.textSecondary,
                marginBottom: 20,
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              {reason || getDefaultReason()}
            </ThemedText>

            {/* Optionally show the user’s submitted message (if provided) */}
            {message && (
              <View style={styles.contextBox}>
                <ThemedText
                  type="caption"
                  style={{
                    color: colors.textSecondary,
                    marginBottom: 8,
                    textAlign: "left",
                  }}
                >
                  Your submitted message:
                </ThemedText>
                <ThemedText
                  type="body"
                  style={{
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {message}
                </ThemedText>
              </View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#0005", // dark overlay for pop effect
    zIndex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    zIndex: 2,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    shadowOpacity: 0.09,
    shadowOffset: { width: 0, height: -8 },
    shadowRadius: 16,
    elevation: 24,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 25,
    right: 25,
    zIndex: 30,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dragIndicator: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 22,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 42, // leave space for close & drag
    paddingBottom: 8,
    justifyContent: "flex-start",
  },
  contextBox: {
    marginBottom: 24,
    marginTop: 6,
  },
});
