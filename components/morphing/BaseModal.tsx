import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
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
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

interface BaseModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  theme: "light" | "dark";
  backgroundColor: string;
  buttonContent: React.ReactNode;
  children: React.ReactNode;
  buttonContentOpacityRange?: [number, number];
  closeButtonColor?: string;
  buttonBackgroundColor?: string;
  buttonContentPadding?: number;
  buttonBorderWidth?: number;
  buttonBorderColor?: string;
  buttonBorderRadius?: number;
}

export function BaseModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  theme,
  backgroundColor,
  buttonContent,
  children,
  buttonContentOpacityRange = [0, 0.3],
  closeButtonColor,
  buttonBackgroundColor,
  buttonContentPadding = 20,
  buttonBorderWidth = 0,
  buttonBorderColor = "transparent",
  buttonBorderRadius = 0,
}: BaseModalProps) {
  const { colors } = useTheme();
  const gestureY = useSharedValue(0);

  // Simple fix: render BlurView on next frame
  const [blurReady, setBlurReady] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // 100ms delay ensures BlurView initializes properly
      setTimeout(() => setBlurReady(true), 50);
    } else {
      setBlurReady(false);
    }
  }, [isVisible]);

  const buttonColor = closeButtonColor || colors.closeButtonText;
  const buttonBgColor = buttonBackgroundColor || backgroundColor;

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
              scheduleOnRN(close, event.velocityY);
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

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.5]),
  }));

  const solidBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7], [1, 0], "clamp"),
  }));

  const blurBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.1, 0.3], [0, 1], "clamp"),
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.15, 1], [0, 1], "clamp"),
  }));

  const buttonContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      buttonContentOpacityRange,
      [1, 0],
      "clamp"
    ),
  }));

  const closeButtonGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(close);
  });

  // *** New: fade the entire modal as it returns to the button ***
  const modalFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.02, 1], // last 12% of animation will fade out
      [0, 1, 1],
      "clamp"
    ),
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
          { backgroundColor: colors.shadow, zIndex: 10 },
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
          modalFadeStyle, // <<<<< The fade out effect!
          { overflow: "hidden", zIndex: 20 },
        ]}
        pointerEvents="box-none"
      >
        {/* Invisible touch blocker to prevent overlay taps from closing modal */}
        <View style={StyleSheet.absoluteFill} pointerEvents="auto" />
        {/* Solid background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: buttonBgColor },
            solidBackgroundStyle,
          ]}
        />

        {/* BlurView - render after next frame */}
        {blurReady && (
          <Animated.View style={[StyleSheet.absoluteFill, blurBackgroundStyle]}>
            <BlurView
              intensity={Platform.OS === "android" ? 100 : 50}
              tint={theme === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            >
              <View
                style={[
                  styles.blurBackground,
                  {
                    backgroundColor: `${backgroundColor}99`,
                    borderColor: colors.modalCardBorder,
                  },
                ]}
              />
            </BlurView>
          </Animated.View>
        )}

        {/* Fallback background (very brief, until blur renders) */}
        {!blurReady && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              blurBackgroundStyle,
              {
                backgroundColor: `${backgroundColor}DD`,
                borderWidth: 1,
                borderColor: colors.modalCardBorder,
              },
            ]}
          />
        )}

        {/* Button Content */}
        <Animated.View
          style={[
            styles.buttonContentContainer,
            {
              padding: buttonContentPadding,
              borderWidth: buttonBorderWidth,
              borderColor: buttonBorderColor,
              borderRadius: buttonBorderRadius,
            },
            buttonContentStyle,
          ]}
          pointerEvents="box-none"
        >
          {buttonContent}
        </Animated.View>

        {/* Modal Content - WITHOUT GestureDetector */}
        <Animated.View style={[styles.modalContent, modalContentStyle]}>
          <GestureDetector gesture={closeButtonGesture}>
            <Animated.View
              style={[
                styles.closeButton,
                { backgroundColor: colors.closeButtonBackground },
              ]}
            >
              <IconSymbol
                name="xmark"
                size={18}
                weight="light"
                color={buttonColor}
              />
            </Animated.View>
          </GestureDetector>

          {children}

          {/* GestureDetector ONLY wraps the drag indicator area */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.dragIndicatorContainer}>
              <View
                style={[
                  styles.bottomDragIndicator,
                  { backgroundColor: colors.dragIndicator },
                ]}
              />
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0,
  },
  buttonContentContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    padding: 24,
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
  dragIndicatorContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
  },
  bottomDragIndicator: {
    width: 200,
    height: 4,
    borderRadius: 2,
  },
});
