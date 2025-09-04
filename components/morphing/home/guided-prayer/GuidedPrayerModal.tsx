// GuidedPrayerModal.tsx - Updated to fetch dynamic reflection content
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { db } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BaseModal } from "../../BaseModal";
import { GuidedPrayerContent } from "./GuidedPrayerContent";
import { PrayerStepNavigation } from "./PrayerStepNavigation";
import { PrayerTimer } from "./PrayerTimer";
import { PRAYER_STEPS, PrayerStep, getNextStep } from "./prayerUtils";

interface GuidedPrayerModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function GuidedPrayerModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: GuidedPrayerModalProps) {
  const { colors, effectiveTheme } = useTheme();

  const [currentStep, setCurrentStep] = useState<PrayerStep>("intro");
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [steps, setSteps] = useState(PRAYER_STEPS);

  // Fetch reflection content on mount
  useEffect(() => {
    const fetchReflectionContent = async () => {
      const today = new Date().toISOString().split("T")[0];
      try {
        const docRef = doc(db, "dailyContent", today);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const content = data?.prayerContent;
          if (content) {
            setSteps((prev) => ({
              ...prev,
              reflection: {
                ...prev.reflection,
                content,
              },
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch reflection content:", err);
      }
    };

    fetchReflectionContent();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      setCurrentStep("intro");
      setIsTimerActive(false);
    }
  }, [isVisible]);

  const handleStepChange = (step: PrayerStep) => {
    setIsTimerActive(false);
    setCurrentStep(step);

    const stepConfig = steps[step];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

  const stepInfo = steps[currentStep];

  const buttonContent = (
    <View style={styles.prayerButtonContent}>
      <GuidedPrayerContent
        showButtons={true}
        onBeginPrayer={() => handleStepChange("breathing")}
      />
    </View>
  );

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
      theme={effectiveTheme ?? "dark"}
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
