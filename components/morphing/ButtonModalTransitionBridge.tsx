import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Dimensions } from "react-native";
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
  /**
   * Render prop. You get:
   *  - open: call to open modal
   *  - close: call to close modal
   *  - isModalVisible: modal open state
   *  - progress: Reanimated sharedValue (0=button, 1=modal)
   *  - animated styles for button & modal
   *  - buttonRef: attach to your button for measuring
   *  - measured layout
   *  - handlePressIn/Out: for button press animations
   */
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
  modalWidthPercent?: number; // default 0.9
  modalHeightPercent?: number; // default 0.7
  modalBorderRadius?: number; // default 28
  buttonBorderRadius?: number; // default 20
}

export function ButtonModalTransitionBridge({
  children,
  modalWidthPercent = 0.9,
  modalHeightPercent = 0.7,
  modalBorderRadius = 28,
  buttonBorderRadius = 20,
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

  // --- Button press handlers ---
  const handlePressIn = () => {
    if (!isModalVisible) {
      // Measure FIRST at full scale, then immediately start press animation
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

      // Start press animation immediately (doesn't wait for measurement)
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

    // Animate after visible with haptic feedback
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
    opacity: interpolate(progress.value, [0, 0.1], [1, 0], "clamp"),
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
      [buttonLayout.y, targetTop]
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
