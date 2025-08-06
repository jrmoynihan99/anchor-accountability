import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const TAB_MARGIN = 20;
const TAB_WIDTH = screenWidth - TAB_MARGIN * 2;
const TAB_HEIGHT = 76;
const MODAL_RADIUS = 50; // For the expanded modal

export function FloatingReachOutTab() {
  const [open, setOpen] = useState(false);

  // 0 = closed, 1 = open
  const progress = useSharedValue(0);
  const gestureY = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Tab positioning: 20px from sides, flush with bottom of screen
  const tabLeft = TAB_MARGIN;
  const tabTop = screenHeight - TAB_HEIGHT; // Flush with bottom edge

  const openModal = () => {
    setOpen(true);
    progress.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.quad), // iOS-like smooth opening
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openModal();
  };

  const handlePressIn = () => {
    pressScale.value = withTiming(0.97, {
      duration: 100,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  const closeModal = () => {
    progress.value = withTiming(
      0,
      {
        duration: 200,
        easing: Easing.inOut(Easing.quad), // iOS-like smooth closing
      },
      (finished) => {
        if (finished) runOnJS(setOpen)(false);
      }
    );
  };

  // Gesture handler for drag-to-close using new Gesture API
  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureY.value = 0;
    })
    .onUpdate((event) => {
      // Only allow downward dragging
      if (event.translationY > 0) {
        gestureY.value = event.translationY;
        // Convert drag distance to progress (0-1)
        const dragProgress = Math.min(event.translationY / 300, 1);
        progress.value = 1 - dragProgress;
      }
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > 100 || event.velocityY > 500;

      if (shouldClose) {
        // Close with timing animation to match open
        progress.value = withTiming(
          0,
          {
            duration: 200,
            easing: Easing.inOut(Easing.quad),
          },
          (finished) => {
            if (finished) {
              runOnJS(setOpen)(false);
              gestureY.value = 0;
            }
          }
        );
      } else {
        // Snap back to open with timing
        progress.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
        gestureY.value = 0;
      }
    });

  // Animated modal style
  const modalAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(progress.value, [0, 1], [TAB_WIDTH, screenWidth]);
    const height = interpolate(
      progress.value,
      [0, 1],
      [TAB_HEIGHT, screenHeight]
    );
    const left = interpolate(progress.value, [0, 1], [tabLeft, 0]);
    const top = interpolate(progress.value, [0, 1], [tabTop, 0]);

    // Custom border radius for closed state: rounded top corners, square bottom corners
    const borderTopLeftRadius = interpolate(
      progress.value,
      [0, 1],
      [24, MODAL_RADIUS]
    );
    const borderTopRightRadius = interpolate(
      progress.value,
      [0, 1],
      [24, MODAL_RADIUS]
    );
    const borderBottomLeftRadius = interpolate(
      progress.value,
      [0, 1],
      [0, MODAL_RADIUS] // 0 when closed, MODAL_RADIUS when open
    );
    const borderBottomRightRadius = interpolate(
      progress.value,
      [0, 1],
      [0, MODAL_RADIUS] // 0 when closed, MODAL_RADIUS when open
    );

    // Only apply scale when in closed state (progress near 0)
    const scale = progress.value < 0.1 ? pressScale.value : 1;

    return {
      position: "absolute",
      width,
      height,
      left,
      top,
      borderTopLeftRadius,
      borderTopRightRadius,
      borderBottomLeftRadius,
      borderBottomRightRadius,
      backgroundColor: "#CBAD8D",
      zIndex: 20,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      overflow: "hidden", // Force clipping on both platforms
      transform: [{ scale }],
    };
  });

  // Overlay animated style
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.4]),
  }));

  // Pill button content animated style - fades out early
  const pillContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1], [1, 0], "clamp"),
  }));

  // Modal content animated style - fades in later
  const modalContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.15, 1], [0, 1], "clamp"),
  }));

  return (
    <>
      {open && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#000", zIndex: 10 },
            overlayAnimatedStyle,
          ]}
          pointerEvents={open ? "auto" : "none"}
        />
      )}

      <Animated.View style={modalAnimatedStyle}>
        {/* Pill button content - always rendered but with animated opacity */}
        <Animated.View style={[styles.pillButton, pillContentAnimatedStyle]}>
          <TouchableOpacity
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginTop: -16, // Move content up while keeping it centered
            }}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Ionicons
              name="shield-checkmark"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.pillText}>I'm Being Tempted</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Modal content - always rendered but with animated opacity */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              { flex: 1, padding: 24, justifyContent: "center" },
              modalContentAnimatedStyle,
            ]}
            pointerEvents={open ? "auto" : "none"}
          >
            {/* Close (X) Button */}
            <TouchableOpacity
              onPress={closeModal}
              style={styles.closeButton}
              hitSlop={16}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#3A2D28" />
            </TouchableOpacity>

            {/* Modal Content */}
            <Text
              style={{
                color: "#3A2D28",
                fontSize: 22,
                fontWeight: "700",
                marginTop: 32,
              }}
            >
              Need Support?
            </Text>
            <Text style={{ color: "#3A2D28", marginVertical: 12 }}>
              (Optional context input here)
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 24,
                padding: 16,
                backgroundColor: "#3A2D28",
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={closeModal}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Send & Sit Tight
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    position: "absolute",
    top: 0,
    left: 0,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    backgroundColor: "transparent", // Let the parent handle background
    shadowColor: "transparent", // Remove shadows since parent handles them
    elevation: 0,
  },
  pillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.3,
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
});
