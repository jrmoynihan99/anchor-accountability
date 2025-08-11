// components/IntroContinueButton.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";

interface IntroContinueButtonProps {
  onPress: () => void;
}

export function IntroContinueButton({ onPress }: IntroContinueButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
              backgroundColor: colors.whiteTranslucent,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <ThemedText
            type="buttonLarge"
            style={[styles.buttonText, { color: colors.icon }]}
          >
            Begin Your Journey
          </ThemedText>
          <Ionicons name="arrow-forward" size={20} color={colors.icon} />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    marginBottom: 50,
    marginHorizontal: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  buttonContainer: {
    borderRadius: 20,
    borderWidth: 1,
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
