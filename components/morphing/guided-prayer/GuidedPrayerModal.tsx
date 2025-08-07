import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
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
import { GuidedPrayerContent } from "./GuidedPrayerContent";
import { PrayerStepNavigation } from "./PrayerStepNavigation";
import { PrayerTimer } from "./PrayerTimer";
import { PRAYER_STEPS, PrayerStep, getNextStep } from "./prayerUtils";

interface GuidedPrayerModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function GuidedPrayerModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: GuidedPrayerModalProps) {
  const gestureY = useSharedValue(0);
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const mainTextColor = "#3A2D28";
  const prayerColor = "#8B6914";

  const [currentStep, setCurrentStep] = useState<PrayerStep>("intro");
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isVisible) {
      setCurrentStep("intro");
      setIsTimerActive(false);
    }
  }, [isVisible]);

  const handleStepChange = (step: PrayerStep) => {
    // Stop current timer first
    setIsTimerActive(false);
    setCurrentStep(step);

    const stepConfig = PRAYER_STEPS[step];

    // Always provide haptic feedback for step changes
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start timer if the step has a duration
    if (stepConfig.duration) {
      // Small delay to ensure state updates properly
      setTimeout(() => {
        setIsTimerActive(true);
      }, 50);
    }
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
    const nextStep = getNextStep(currentStep);

    if (nextStep) {
      if (nextStep === "complete") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      handleStepChange(nextStep);
    }
  };

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
    opacity: interpolate(progress.value, [0, 0.3], [1, 0], "clamp"),
  }));

  const stepInfo = PRAYER_STEPS[currentStep];

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
            { backgroundColor: colors.cardBackground },
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
                { backgroundColor: `${colors.cardBackground}B8` },
              ]}
            />
          </BlurView>
        </Animated.View>

        {/* === PRAYER CARD CONTENT (animates in/out) === */}
        <Animated.View
          style={[styles.prayerCardButton, buttonContentStyle]}
          pointerEvents="box-none"
        >
          <View style={styles.prayerButtonContent}>
            <GuidedPrayerContent
              showButtons={true}
              onBeginPrayer={() => handleStepChange("breathing")}
            />
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
              <Ionicons name="close" size={28} color={mainTextColor} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.emoji}>🙏</Text>
                <Text style={[styles.modalTitle, { color: mainTextColor }]}>
                  {stepInfo.title}
                </Text>
                {stepInfo.subtitle && (
                  <Text style={[styles.modalSubtitle, { color: "#8D7963" }]}>
                    {stepInfo.subtitle}
                  </Text>
                )}
              </View>

              {/* Timer Display */}
              {stepInfo.duration && (
                <PrayerTimer
                  duration={stepInfo.duration}
                  isActive={isTimerActive}
                  onComplete={handleTimerComplete}
                  color={prayerColor}
                />
              )}

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={[styles.contentText, { color: mainTextColor }]}>
                  {stepInfo.content}
                </Text>
              </View>

              {/* Step Navigation */}
              <PrayerStepNavigation
                currentStep={currentStep}
                onStepChange={handleStepChange}
                onClose={close}
                prayerColor={prayerColor}
              />
            </ScrollView>

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
  prayerCardButton: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 10,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  prayerButtonContent: {
    alignItems: "stretch",
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
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.8,
  },
  contentContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "500",
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
