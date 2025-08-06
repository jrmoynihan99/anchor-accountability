import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
const PILL_WIDTH = 320;
const PILL_HEIGHT = 100;
const MODAL_RADIUS = 50;

// Separate corner radius controls for closed state
const PILL_TOP_RADIUS = 24;
const PILL_BOTTOM_RADIUS = 12;

export function FloatingReachOutButton() {
  const [open, setOpen] = useState(false);

  // 0 = closed, 1 = open
  const progress = useSharedValue(0);
  const gestureY = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // FAB pill center: horizontally centered, above nav
  const fabLeft = (screenWidth - PILL_WIDTH) / 2;
  const fabTop = screenHeight - PILL_HEIGHT - 100;

  const openModal = () => {
    setOpen(true);
    progress.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.quad),
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
        easing: Easing.inOut(Easing.quad),
      },
      (finished) => {
        if (finished) runOnJS(setOpen)(false);
      }
    );
  };

  // Gesture handler for drag-to-close
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
        progress.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
        gestureY.value = 0;
      }
    });

  // Shadow container style - maintains consistent shadow
  const shadowContainerStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progress.value,
      [0, 1],
      [PILL_WIDTH, screenWidth]
    );
    const height = interpolate(
      progress.value,
      [0, 1],
      [PILL_HEIGHT, screenHeight]
    );
    const left = interpolate(progress.value, [0, 1], [fabLeft, 0]);
    const top = interpolate(progress.value, [0, 1], [fabTop, 0]);

    return {
      position: "absolute",
      width,
      height,
      left,
      top,
      zIndex: 20,
      // Shadow properties on the container
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 7,
    };
  });

  // Content style - handles background, radius, and clipping
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const borderTopLeftRadius = interpolate(
      progress.value,
      [0, 1],
      [PILL_TOP_RADIUS, MODAL_RADIUS]
    );
    const borderTopRightRadius = interpolate(
      progress.value,
      [0, 1],
      [PILL_TOP_RADIUS, MODAL_RADIUS]
    );
    const borderBottomLeftRadius = interpolate(
      progress.value,
      [0, 1],
      [PILL_BOTTOM_RADIUS, MODAL_RADIUS]
    );
    const borderBottomRightRadius = interpolate(
      progress.value,
      [0, 1],
      [PILL_BOTTOM_RADIUS, MODAL_RADIUS]
    );

    // Only apply scale when in closed state
    const scale = progress.value < 0.1 ? pressScale.value : 1;

    return {
      flex: 1,
      borderTopLeftRadius,
      borderTopRightRadius,
      borderBottomLeftRadius,
      borderBottomRightRadius,
      backgroundColor: "#CBAD8D",
      overflow: "hidden",
      transform: [{ scale }],
    };
  });

  // Overlay animated style
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.4]),
  }));

  // Pill button content animated style
  const pillContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.05], [1, 0], "clamp"),
  }));

  // Modal content animated style
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

      {/* Shadow container - maintains shadow properties */}
      <Animated.View style={shadowContainerStyle}>
        {/* Content container - handles background and clipping */}
        <Animated.View style={contentAnimatedStyle}>
          {/* Pill button content */}
          <Animated.View style={[styles.pillButton, pillContentAnimatedStyle]}>
            <TouchableOpacity
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
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

          {/* Modal content */}
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
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    backgroundColor: "transparent",
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
