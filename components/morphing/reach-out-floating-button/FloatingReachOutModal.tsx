import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface FloatingReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function FloatingReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: FloatingReachOutModalProps) {
  const gestureY = useSharedValue(0);

  // Drag-to-close gesture (downward for floating version)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureY.value = 0;
    })
    .onUpdate((event) => {
      if (event.translationY > 0) {
        gestureY.value = event.translationY;
        const dragProgress = Math.min(event.translationY / 300, 1);
        progress.value = 1 - dragProgress;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;

      if (shouldClose) {
        // Use the same timing as original
        progress.value = withTiming(
          0,
          {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
          },
          (finished) => {
            if (finished) {
              runOnJS(close)(event.velocityY);
              gestureY.value = 0;
            }
          }
        );
      } else {
        progress.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
        gestureY.value = 0;
      }
    });

  // Animated styles matching the original
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.4]),
  }));

  const buttonContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.05], [1, 0], "clamp"),
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.15, 1], [0, 1], "clamp"),
  }));

  return (
    <Modal
      visible={isVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => close()}
    >
      {/* Overlay - NOT touchable, just visual */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#000", zIndex: 10 },
          overlayStyle,
        ]}
        pointerEvents="none"
      />

      {/* Modal Container - matches original styling */}
      <Animated.View
        style={[
          modalAnimatedStyle,
          { backgroundColor: "#CBAD8D", overflow: "hidden", zIndex: 20 },
        ]}
      >
        {/* Button Content (during animation) - matches original */}
        <Animated.View
          style={[styles.pillButton, buttonContentStyle]}
          pointerEvents="none"
        >
          <TouchableOpacity
            style={styles.pillButtonTouchable}
            activeOpacity={1}
            disabled={true}
          >
            <View style={styles.pillTextContainer}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.pillText}>Reach Out</Text>
            </View>
            <Text style={styles.subduedText}>Get instant anonymous help</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Modal Content - matches original */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContent, modalContentStyle]}>
            {/* Close Button - matches original exactly */}
            <TouchableOpacity
              onPress={() => close()}
              style={styles.closeButton}
              hitSlop={16}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#3A2D28" />
            </TouchableOpacity>

            {/* Modal Content - matches original exactly */}
            <Text style={styles.modalTitle}>Need Support?</Text>
            <Text style={styles.modalDescription}>
              (Optional context input here)
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => close()}
            >
              <Text style={styles.modalButtonText}>Send & Sit Tight</Text>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Pill button styles - matches original
  pillButton: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 320, // PILL_WIDTH from original
    height: 100, // PILL_HEIGHT from original
    backgroundColor: "transparent",
  },
  pillButtonTouchable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  pillTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22,
    letterSpacing: 0.3,
  },
  subduedText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  // Modal content styles - matches original
  modalContent: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 55,
    right: 30,
    zIndex: 30,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: "#3A2D28",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 32,
  },
  modalDescription: {
    color: "#3A2D28",
    marginVertical: 12,
  },
  modalButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#3A2D28",
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
