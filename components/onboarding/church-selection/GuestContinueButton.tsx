// components/onboarding/church-selection/GuestContinueButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface GuestContinueButtonProps {
  onPress: () => void;
}

export function GuestContinueButton({ onPress }: GuestContinueButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={[styles.buttonShadow, { shadowColor: colors.shadow }]}>
      <BlurView
        intensity={15}
        tint="light"
        style={[
          styles.buttonContainer,
          { borderColor: colors.modalCardBorder },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.guestButton,
            { backgroundColor: colors.buttonBackground },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <ThemedText
            type="buttonLarge"
            style={[styles.buttonText, { color: colors.white }]}
          >
            I'm joining as a guest
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.subtitleText, { color: colors.white }]}
          >
            No church code needed
          </ThemedText>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    marginBottom: 50,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContainer: {
    borderRadius: 20,
    borderWidth: 0,
    overflow: "hidden",
  },
  guestButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  buttonText: {
    fontWeight: "600",
  },
  subtitleText: {
    opacity: 0.8,
  },
});
