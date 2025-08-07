import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
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

interface ReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function ReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: ReachOutModalProps) {
  const gestureY = useSharedValue(0);
  const theme = useColorScheme();
  const accent = Colors[theme ?? "dark"].tint ?? "#CBAD8D";

  // Drag-to-close (swipe UP to close)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureY.value = 0;
    })
    .onUpdate((event) => {
      if (event.translationY < 0) {
        gestureY.value = event.translationY;
        const dragProgress = Math.min(Math.abs(event.translationY) / 200, 1);
        progress.value = 1 - dragProgress;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY < -100 || event.velocityY < -500;
      if (shouldClose) {
        progress.value = withTiming(
          0,
          { duration: 200, easing: Easing.inOut(Easing.quad) },
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

  // Overlay/blur/solid BG animation styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.4]),
  }));
  const solidBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], "clamp"),
  }));
  const blurBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.1, 0.3], [0, 1], "clamp"),
  }));
  const modalContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.15, 1], [0, 1], "clamp"),
  }));
  // Animation for the morphing pill button
  const buttonContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1], [1, 0], "clamp"),
  }));

  return (
    <Modal
      visible={isVisible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => close()}
    >
      {/* Overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#000", zIndex: 10 },
          overlayStyle,
        ]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => close()}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal Card */}
      <Animated.View
        style={[
          modalAnimatedStyle,
          { overflow: "hidden", zIndex: 20, borderRadius: 28 },
        ]}
      >
        {/* Solid background (fades out) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: accent },
            solidBackgroundStyle,
          ]}
        />
        {/* BlurView background (fades in) */}
        <Animated.View style={[StyleSheet.absoluteFill, blurBackgroundStyle]}>
          <BlurView
            intensity={24}
            tint={theme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                styles.blurBackground,
                { backgroundColor: `${accent}B8` },
              ]}
            />
          </BlurView>
        </Animated.View>

        {/* === PILL BUTTON CONTENT (animates in/out) === */}
        <Animated.View
          style={[styles.pillButton, buttonContentStyle]}
          pointerEvents="none"
        >
          <View style={styles.pillButtonTouchable}>
            <View style={styles.pillTextContainer}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.pillText}>Reach Out</Text>
            </View>
            <Text style={styles.subduedText}>Get anonymous help</Text>
          </View>
        </Animated.View>

        {/* === MODAL CONTENT === */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContent, modalContentStyle]}>
            <TouchableOpacity
              onPress={() => close()}
              style={styles.closeButton}
              hitSlop={16}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#3A2D28" />
            </TouchableOpacity>
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
            <View style={styles.bottomDragIndicator} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  pillButton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // Use paddingVertical to perfectly match the button
    paddingVertical: 100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    backgroundColor: "transparent",
  },
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
  pillText: {
    color: "#fff",
    fontWeight: "600", // match original button (was "700", but button is "600")
    fontSize: 24, // match original button
  },
  subduedText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16, // match original button
    fontWeight: "500",
    letterSpacing: 0.2,
  },
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
  bottomDragIndicator: {
    position: "absolute",
    bottom: 12,
    width: 200,
    height: 4,
    backgroundColor: "rgba(58, 45, 40, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
  },
});
