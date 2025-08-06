import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
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
const BUTTON_RADIUS = 20;
const MODAL_RADIUS = 28;

interface ReachOutButtonProps {
  onPress: () => void;
}

export function ReachOutButton({ onPress }: ReachOutButtonProps) {
  const theme = useColorScheme();
  const accent = Colors[theme ?? "dark"].tint;
  const [modalVisible, setModalVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // For measuring position
  const buttonRef = useRef<TouchableOpacity>(null);

  // Animations
  const progress = useSharedValue(0);
  const gestureY = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // === Open Modal ===
  const openModal = () => {
    if (buttonRef.current) {
      // Measure button position before opening modal
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setButtonLayout({ x, y, width, height });
        setModalVisible(true);

        // Start animation after modal is visible
        requestAnimationFrame(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          progress.value = withTiming(1, {
            duration: 400,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          });
        });
      });
    }

    onPress();
  };

  const handlePressIn = () => {
    if (!modalVisible) {
      pressScale.value = withTiming(0.97, {
        duration: 100,
        easing: Easing.quad,
      });
    }
  };

  const handlePressOut = () => {
    if (!modalVisible) {
      pressScale.value = withTiming(1, {
        duration: 150,
        easing: Easing.quad,
      });
    }
  };

  // === Close Modal ===
  const closeModal = (velocity = 0) => {
    // For physics-based closing, calculate how long it would take
    // to reach the end based on current velocity with deceleration
    const currentProgress = progress.value;
    const remainingDistance = currentProgress; // Distance to go from current to 0

    if (Math.abs(velocity) > 100) {
      // Physics-based: continue at current velocity with deceleration
      // Convert velocity from px/s to progress/s (since our progress is 0-1)
      const progressVelocity = Math.abs(velocity) / 200; // Adjust this divisor to tune feel

      // Calculate duration based on physics: distance = velocity * time - 0.5 * deceleration * time^2
      // Simplified: time ≈ distance / (velocity * damping)
      const duration = Math.max(
        100, // Minimum duration
        Math.min(600, (remainingDistance / progressVelocity) * 1000) // Convert to ms
      );

      progress.value = withTiming(
        0,
        {
          duration,
          easing: Easing.out(Easing.quad), // Natural deceleration
        },
        (finished) => {
          if (finished) {
            runOnJS(setModalVisible)(false);
          }
        }
      );
    } else {
      // Fallback for slow drags - use standard animation
      progress.value = withTiming(
        0,
        {
          duration: 300,
          easing: Easing.bezier(0.4, 0, 1, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(setModalVisible)(false);
          }
        }
      );
    }
  };

  // === Drag-to-close gesture ===
  const panGesture = Gesture.Pan()
    .onStart(() => {
      gestureY.value = 0;
    })
    .onUpdate((event) => {
      // Only allow upward gestures (negative translationY)
      if (event.translationY < 0) {
        gestureY.value = event.translationY;
        const dragProgress = Math.min(Math.abs(event.translationY) / 200, 1);
        progress.value = 1 - dragProgress;
      }
    })
    .onEnd((event) => {
      // Close only on significant upward drag
      const shouldClose = event.translationY < -100 || event.velocityY < -500;

      if (shouldClose) {
        // Pass the velocity to closeModal for dynamic timing
        runOnJS(closeModal)(event.velocityY);
        gestureY.value = withTiming(0);
      } else {
        progress.value = withTiming(1, {
          duration: 180,
          easing: Easing.quad,
        });
        gestureY.value = withTiming(0);
      }
    });

  // === Modal Animation Styles ===
  const modalContainerStyle = useAnimatedStyle(() => {
    const targetWidth = screenWidth * 0.9; // 90% width (5% margin on each side)
    const targetHeight = screenHeight * 0.7; // 70% height
    const targetLeft = screenWidth * 0.05; // 5% margin from left
    const targetTop = (screenHeight - targetHeight) / 2; // Center vertically

    const width = interpolate(
      progress.value,
      [0, 1],
      [buttonLayout.width, targetWidth]
    );
    const height = interpolate(
      progress.value,
      [0, 1],
      [buttonLayout.height, targetHeight]
    );
    const left = interpolate(
      progress.value,
      [0, 1],
      [buttonLayout.x, targetLeft]
    );
    const top = interpolate(
      progress.value,
      [0, 1],
      [buttonLayout.y, targetTop]
    );
    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [BUTTON_RADIUS, MODAL_RADIUS]
    );

    return {
      position: "absolute",
      width,
      height,
      left,
      top,
      borderRadius,
      overflow: "hidden",
    };
  });

  // Solid background color that fades out
  const solidBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [1, 0], "clamp"),
  }));

  // Blur background that fades in
  const blurBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.1, 0.3], [0, 1], "clamp"),
  }));

  // Overlay
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.4]),
  }));

  // Button content in modal
  const buttonContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.05], [1, 0], "clamp"),
  }));

  // Modal content
  const modalContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.2, 1], [0, 1], "clamp"),
  }));

  // Button scale animation and visibility
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    opacity: interpolate(progress.value, [0, 0.1], [1, 0], "clamp"), // Animate opacity based on progress
  }));

  return (
    <>
      {/* Regular button in ScrollView */}
      <Animated.View style={[styles.shadowContainer, buttonStyle]}>
        <TouchableOpacity
          ref={buttonRef}
          style={[styles.button, { backgroundColor: accent }]}
          onPress={openModal}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.textContainer}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.text}>Reach Out</Text>
          </View>
          <Text style={styles.subduedText}>Get anonymous help</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Portal Modal */}
      <Modal
        visible={modalVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeModal}
      >
        {/* Overlay */}
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { opacity: modalVisible ? 1 : 0 }]}
          onPress={() => closeModal()}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#000" },
              overlayStyle,
            ]}
          />
        </TouchableOpacity>

        {/* Animated modal container */}
        <Animated.View style={modalContainerStyle}>
          {/* Solid background that fades out during transition */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: accent },
              solidBackgroundStyle,
            ]}
          />

          {/* BlurView as background that fades in during transition */}
          <Animated.View style={[StyleSheet.absoluteFill, blurBackgroundStyle]}>
            <BlurView
              intensity={20}
              tint={theme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            >
              {/* Additional background styling to match your pill navigation */}
              <View
                style={[
                  styles.blurBackground,
                  { backgroundColor: `${accent}90` },
                ]}
              />
            </BlurView>
          </Animated.View>

          {/* Button content (shows during animation start) */}
          <Animated.View
            style={[styles.modalButtonContent, buttonContentStyle]}
          >
            <View style={styles.textContainer}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalButtonText}>Reach Out</Text>
            </View>
            <Text style={styles.subduedText}>Get anonymous help</Text>
          </Animated.View>

          {/* Modal content (shows when fully opened) */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.modalContent, modalContentStyle]}>
              {/* Close button */}
              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
                hitSlop={16}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#3A2D28" />
              </TouchableOpacity>

              {/* Modal Content */}
              <Text style={styles.modalTitle}>Need Support?</Text>
              <Text style={styles.modalDescription}>
                We're here to help. Your request will be handled with complete
                confidentiality.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Send & Sit Tight</Text>
              </TouchableOpacity>

              {/* Bottom drag indicator - positioned at actual bottom */}
              <View style={styles.bottomDragIndicator} />
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    // Shadow properties on the container
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 20, // Match the button's border radius
  },
  button: {
    paddingVertical: 100,
    borderRadius: 20, // Changed from 999 (pill) to 20 (rounded rectangle)
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  text: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  subduedText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  modalButtonContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalContent: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 30,
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
    fontSize: 16,
    lineHeight: 22,
  },
  modalButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#3A2D28",
    borderRadius: 12,
    alignItems: "center",
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
