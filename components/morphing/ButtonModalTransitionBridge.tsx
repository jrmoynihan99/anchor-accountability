import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export interface ButtonModalTransitionBridgeProps {
  children: (args: {
    open: () => void;
    close: (velocity?: number) => void;
    isModalVisible: boolean;
    progress: Animated.SharedValue<number>;
    buttonAnimatedStyle: any;
    modalAnimatedStyle: any;
    buttonRef: React.Ref<any>;
    buttonLayout: { x: number; y: number; width: number; height: number };
    handlePressIn: () => void;
    handlePressOut: () => void;
  }) => React.ReactNode;
  modalWidthPercent?: number;
  modalHeightPercent?: number;
  modalBorderRadius?: number;
  buttonBorderRadius?: number;
  buttonFadeThreshold?: number; // New prop for custom fade-in timing
}

export function ButtonModalTransitionBridge({
  children,
  modalWidthPercent = 0.9,
  modalHeightPercent = 0.7,
  modalBorderRadius = 28,
  buttonBorderRadius = 20,
  buttonFadeThreshold = 0.1, // Default to 0.1 (10%)
}: ButtonModalTransitionBridgeProps) {
  // --- State & refs ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const buttonRef = useRef<any>(null);

  // --- Animated values ---
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const keyboardOffset = useSharedValue(0);

  // --- Keyboard handling ---
  useEffect(() => {
    // Alternative with the exact iOS keyboard animation curve

    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        if (isModalVisible) {
          const keyboardHeight = event.endCoordinates.height;
          const modalBottom =
            (screenHeight + screenHeight * modalHeightPercent) / 2;
          const overlap = modalBottom - (screenHeight - keyboardHeight);

          if (overlap > 0) {
            keyboardOffset.value = withTiming(-overlap - 20, {
              duration: Platform.OS === "ios" ? event.duration : 250,
              // Exact iOS keyboard animation curve
              easing:
                Platform.OS === "ios"
                  ? Easing.bezier(0.25, 0.46, 0.45, 0.94) // iOS UIView animation curve
                  : Easing.bezier(0.22, 1, 0.36, 1),
            });
          }
        }
      }
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        keyboardOffset.value = withTiming(0, {
          duration: Platform.OS === "ios" ? event.duration : 250,
          // Exact iOS keyboard animation curve
          easing:
            Platform.OS === "ios"
              ? Easing.bezier(0.25, 0.46, 0.45, 0.94) // iOS UIView animation curve
              : Easing.bezier(0.22, 1, 0.36, 1),
        });
      }
    );

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [isModalVisible]);

  // --- Button press handlers ---
  const handlePressIn = () => {
    if (!isModalVisible) {
      if (
        buttonRef.current &&
        typeof buttonRef.current.measureInWindow === "function"
      ) {
        buttonRef.current.measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            setButtonLayout({ x, y, width, height });
          }
        );
      }

      pressScale.value = withTiming(0.97, {
        duration: 100,
        easing: Easing.quad,
      });
    }
  };

  const handlePressOut = () => {
    if (!isModalVisible) {
      pressScale.value = withTiming(1, {
        duration: 150,
        easing: Easing.quad,
      });
    }
  };

  // --- Modal open ---
  const open = () => {
    setIsModalVisible(true);
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    });
  };

  // --- Modal close ---
  const close = (velocity = 0) => {
    // Reset keyboard offset when closing
    keyboardOffset.value = 0;

    const currentProgress = progress.value;
    const remainingDistance = currentProgress;
    if (Math.abs(velocity) > 100) {
      const progressVelocity = Math.abs(velocity) / 150;
      const duration = Math.max(
        80,
        Math.min(600, (remainingDistance / progressVelocity) * 1000)
      );
      progress.value = withTiming(
        0,
        { duration, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(setIsModalVisible)(false);
        }
      );
    } else {
      progress.value = withTiming(
        0,
        { duration: 200, easing: Easing.bezier(0.4, 0, 1, 1) },
        (finished) => {
          if (finished) runOnJS(setIsModalVisible)(false);
        }
      );
    }
  };

  // --- Animated styles ---
  const targetWidth = screenWidth * modalWidthPercent;
  const targetHeight = screenHeight * modalHeightPercent;
  const targetLeft = (screenWidth * (1 - modalWidthPercent)) / 2;
  const targetTop = (screenHeight - targetHeight) / 2;

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, buttonFadeThreshold],
      [1, 0],
      "clamp"
    ),
    transform: [{ scale: pressScale.value }],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => {
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
      [buttonLayout.y, targetTop + keyboardOffset.value] // Add keyboard offset here
    );
    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [buttonBorderRadius, modalBorderRadius]
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

  // --- Render ---
  return children({
    open,
    close,
    isModalVisible,
    progress,
    buttonAnimatedStyle,
    modalAnimatedStyle,
    buttonRef,
    buttonLayout,
    handlePressIn,
    handlePressOut,
  });
}
