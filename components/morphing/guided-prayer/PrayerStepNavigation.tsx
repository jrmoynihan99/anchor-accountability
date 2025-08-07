import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
            color="#fff"
            size={16}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryButtonText}>Begin Prayer</Text>
        </TouchableOpacity>
      )}

      {currentStep === "breathing" && (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: prayerColor }]}
          onPress={() => onStepChange("reflection")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Move on</Text>
          <IconSymbol
            name="arrow.right"
            color="#fff"
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
              { backgroundColor: "rgba(139, 105, 20, 0.3)" },
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
            <Text style={[styles.secondaryButtonText, { color: prayerColor }]}>
              Go back
            </Text>
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
            <Text style={styles.primaryButtonText}>Move on</Text>
            <IconSymbol
              name="arrow.right"
              color="#fff"
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
              { backgroundColor: "rgba(139, 105, 20, 0.3)" },
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
            <Text style={[styles.secondaryButtonText, { color: prayerColor }]}>
              Go back
            </Text>
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
              color="#fff"
              size={20}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryButtonText}>Amen</Text>
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
                    step === currentStep
                      ? prayerColor
                      : "rgba(139, 105, 20, 0.3)",
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
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
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
