import { useModalRegistration } from "@/hooks/useGlobalModalManager";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Platform } from "react-native";
import {
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export interface ButtonModalTransitionBridgeProps {
  children: (args: {
    open: () => void; // unchanged
    openOriginless: () => void; // NEW: force slide-up fallback
    close: (velocity?: number) => void;
    isModalVisible: boolean;
    progress: SharedValue<number>;
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
  buttonFadeThreshold?: number;
}

export function ButtonModalTransitionBridge({
  children,
  modalWidthPercent = 0.9,
  modalHeightPercent = 0.7,
  modalBorderRadius = 28,
  buttonBorderRadius = 20,
  buttonFadeThreshold = 0.05,
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

  // openMode: 0 = morph from button, 1 = originless slide-up
  const openMode = useSharedValue<0 | 1>(0);

  // --- Modal close ---
  const close = (velocity = 0) => {
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
        { duration: 300, easing: Easing.bezier(0.4, 0, 0.6, 1) },
        (finished) => {
          if (finished) runOnJS(setIsModalVisible)(false);
        }
      );
    }
  };

  // Register this modal with the global manager when it's visible
  useModalRegistration(isModalVisible, close);

  // --- Keyboard handling ---
  useEffect(() => {
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
              easing:
                Platform.OS === "ios"
                  ? Easing.bezier(0.25, 0.46, 0.45, 0.94)
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
          easing:
            Platform.OS === "ios"
              ? Easing.bezier(0.25, 0.46, 0.45, 0.94)
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

  // --- Helpers ---
  const targetWidth = screenWidth * modalWidthPercent;
  const targetHeight = screenHeight * modalHeightPercent;
  const targetLeft = (screenWidth * (1 - modalWidthPercent)) / 2;
  const targetTop = (screenHeight - targetHeight) / 2;

  // --- Modal open (morph-first, auto-fallback if no origin) ---
  const open = () => {
    // If we don't have a measured origin, use originless slide-up fallback
    const hasOrigin = buttonLayout.width > 0 && buttonLayout.height > 0;

    // iOS: morph when we have origin, otherwise slide-up
    // Android: ALWAYS use slide-up (perf-friendly)
    const shouldMorph = Platform.OS === "ios" && hasOrigin;
    openMode.value = shouldMorph ? 0 : 1;

    setIsModalVisible(true);
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      });
    });
  };

  // --- Modal open (force originless) ---
  const openOriginless = () => {
    openMode.value = 1; // force slide-up mode
    setIsModalVisible(true);
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      progress.value = withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      });
    });
  };

  // --- Animated styles ---
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity:
      openMode.value === 1
        ? 1 // Keep button visible during slide-up
        : interpolate(
            progress.value,
            [0, buttonFadeThreshold],
            [1, 0],
            "clamp"
          ),
    transform: [{ scale: pressScale.value }],
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => {
    // originless slide-up mode
    if (openMode.value === 1) {
      const y = interpolate(
        progress.value,
        [0, 1],
        [screenHeight, targetTop + keyboardOffset.value]
      );

      return {
        position: "absolute",
        width: targetWidth,
        height: targetHeight,
        left: targetLeft,
        transform: [{ translateY: y }],
        borderRadius: modalBorderRadius,
        overflow: "hidden",
      };
    }

    // morph-from-button mode (original behavior)
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
      [buttonLayout.y, targetTop + keyboardOffset.value]
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

  return children({
    open,
    openOriginless, // <- NEW
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
