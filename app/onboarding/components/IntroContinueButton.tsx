// components/IntroContinueButton.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../components/ThemedText";

interface IntroContinueButtonProps {
  onPress: () => void;
}

export function IntroContinueButton({ onPress }: IntroContinueButtonProps) {
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
          {
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.buttonBackground,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <ThemedText
            type="buttonLarge"
            style={[styles.buttonText, { color: colors.white }]}
          >
            Begin Your Journey
          </ThemedText>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    marginBottom: 50,
    marginHorizontal: 20,
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
  continueButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontWeight: "600",
  },
});
