import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { PrayerStep, getNextStep, getPreviousStep } from "./prayerUtils";

interface PrayerStepNavigationProps {
  currentStep: PrayerStep;
  onStepChange: (step: PrayerStep) => void;
  onClose: () => void;
  prayerColor: string;
}

export function PrayerStepNavigation({
  currentStep,
  onStepChange,
  onClose,
  prayerColor,
}: PrayerStepNavigationProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const previousStep = getPreviousStep(currentStep);
  const nextStep = getNextStep(currentStep);

  return (
    <View style={styles.stepNavigation}>
      {currentStep === "intro" && (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: prayerColor }]}
          onPress={() => onStepChange("breathing")}
          activeOpacity={0.85}
        >
          <IconSymbol
            name="play.fill"
            color={colors.white}
            size={16}
            style={{ marginRight: 8 }}
          />
          <ThemedText
            type="button"
            lightColor={colors.white}
            darkColor={colors.white}
          >
            Begin Prayer
          </ThemedText>
        </TouchableOpacity>
      )}

      {currentStep === "breathing" && (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: prayerColor }]}
          onPress={() => onStepChange("reflection")}
          activeOpacity={0.85}
        >
          <ThemedText
            type="button"
            lightColor={colors.white}
            darkColor={colors.white}
          >
            Move on
          </ThemedText>
          <IconSymbol
            name="arrow.right"
            color={colors.white}
            size={16}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      )}

      {currentStep === "reflection" && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: `${prayerColor}4D` }, // 30% opacity
            ]}
            onPress={() => onStepChange("breathing")}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="arrow.left"
              color={prayerColor}
              size={16}
              style={{ marginRight: 8 }}
            />
            <ThemedText
              type="button"
              lightColor={prayerColor}
              darkColor={prayerColor}
            >
              Go back
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.halfButton,
              { backgroundColor: prayerColor },
            ]}
            onPress={() => onStepChange("complete")}
            activeOpacity={0.85}
          >
            <ThemedText
              type="button"
              lightColor={colors.white}
              darkColor={colors.white}
            >
              Move on
            </ThemedText>
            <IconSymbol
              name="arrow.right"
              color={colors.white}
              size={16}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      )}

      {currentStep === "complete" && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: `${prayerColor}4D` }, // 30% opacity
            ]}
            onPress={() => onStepChange("reflection")}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="arrow.left"
              color={prayerColor}
              size={16}
              style={{ marginRight: 8 }}
            />
            <ThemedText
              type="button"
              lightColor={prayerColor}
              darkColor={prayerColor}
            >
              Go back
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.halfButton,
              { backgroundColor: prayerColor },
            ]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="heart.fill"
              color={colors.white}
              size={20}
              style={{ marginRight: 8 }}
            />
            <ThemedText
              type="button"
              lightColor={colors.white}
              darkColor={colors.white}
            >
              Amen
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Prayer Steps Indicator */}
      <View style={styles.stepsIndicator}>
        {(["intro", "breathing", "reflection", "complete"] as PrayerStep[]).map(
          (step) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    step === currentStep ? prayerColor : `${prayerColor}4D`,
                },
              ]}
            />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepNavigation: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginVertical: 8,
  },
  halfButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginVertical: 8,
  },
  // text styles now handled by ThemedText (type="button")
  stepsIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    marginTop: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
