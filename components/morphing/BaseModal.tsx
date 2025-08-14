import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { BlurView } from "expo-blur";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface BaseModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  theme: "light" | "dark";
  backgroundColor: string; // Solid background color for button content
  buttonContent: React.ReactNode; // What shows during the button transition state
  children: React.ReactNode; // Modal content
  buttonContentOpacityRange?: [number, number]; // Custom opacity range for button content
  closeButtonColor?: string; // Custom close button color
  // New props for button styling compatibility
  buttonBackgroundColor?: string; // Background color for the button content container
  buttonContentPadding?: number; // Padding for button content (defaults to 16 for PleaCard)
  buttonBorderWidth?: number; // Border width to account for content positioning
  buttonBorderColor?: string; // Border color for the button content
  buttonBorderRadius?: number; // Border radius for the button content
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
  buttonContentOpacityRange = [0, 0.3], // Default range
  closeButtonColor, // Will use default from colors if not provided
  buttonBackgroundColor, // Use this for button content background if provided
  buttonContentPadding = 20, // Default padding, but PleaCard uses 16
  buttonBorderWidth = 0, // Default no border
  buttonBorderColor = "transparent", // Default transparent border
  buttonBorderRadius = 0, // Default no border radius
}: BaseModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const gestureY = useSharedValue(0);

  // Use provided colors or fallback to defaults
  const buttonColor = closeButtonColor || colors.closeButtonText;
  const buttonBgColor = buttonBackgroundColor || backgroundColor;

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

  // Animation styles
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

  const buttonContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      buttonContentOpacityRange,
      [1, 0],
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
        style={[modalAnimatedStyle, { overflow: "hidden", zIndex: 20 }]}
      >
        {/* Solid background (fades out) - uses buttonBackgroundColor for button content */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: buttonBgColor },
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
                {
                  backgroundColor: `${backgroundColor}B8`,
                  borderColor: colors.modalCardBorder,
                },
              ]}
            />
          </BlurView>
        </Animated.View>

        {/* Button Content (shows during transition) */}
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

        {/* Modal Content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContent, modalContentStyle]}>
            <TouchableOpacity
              onPress={() => close()}
              style={[
                styles.closeButton,
                { backgroundColor: colors.closeButtonBackground },
              ]}
              hitSlop={16}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="xmark"
                size={18}
                weight="light"
                color={buttonColor}
              />
            </TouchableOpacity>

            {children}

            <View
              style={[
                styles.bottomDragIndicator,
                { backgroundColor: colors.dragIndicator },
              ]}
            />
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
    top: 55,
    right: 30,
    zIndex: 30,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomDragIndicator: {
    position: "absolute",
    bottom: 12,
    width: 200,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
});
