// GuidedPrayerModal.tsx - Refactored to use ThemedText
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
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
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

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

  const stepInfo = PRAYER_STEPS[currentStep];

  // Button content (what shows during the transition)
  const buttonContent = (
    <View style={styles.prayerButtonContent}>
      <GuidedPrayerContent
        showButtons={true}
        onBeginPrayer={() => handleStepChange("breathing")}
      />
    </View>
  );

  // Modal content
  const modalContent = (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <ThemedText style={{ fontSize: 48, lineHeight: 48, marginBottom: 12 }}>
          🙏
        </ThemedText>
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginBottom: 4 }}
        >
          {stepInfo.title}
        </ThemedText>
        {stepInfo.subtitle && (
          <ThemedText
            type="subtitleMedium"
            lightColor={colors.textSecondary}
            darkColor={colors.textSecondary}
            style={{ textAlign: "center", opacity: 0.8 }}
          >
            {stepInfo.subtitle}
          </ThemedText>
        )}
      </View>

      {/* Timer Display */}
      {stepInfo.duration && (
        <PrayerTimer
          duration={stepInfo.duration}
          isActive={isTimerActive}
          onComplete={handleTimerComplete}
          color={colors.buttonBackground}
        />
      )}

      {/* Content */}
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText type="bodyMedium" style={{ textAlign: "center" }}>
          {stepInfo.content}
        </ThemedText>
      </View>

      {/* Step Navigation */}
      <PrayerStepNavigation
        currentStep={currentStep}
        onStepChange={handleStepChange}
        onClose={close}
        prayerColor={colors.buttonBackground}
      />
    </ScrollView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={theme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonContent={buttonContent}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  prayerButtonContent: {
    alignItems: "stretch",
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
  contentContainer: {
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
});
