// components/ui/BackButton.tsx
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

interface BackButtonProps {
  onPress: () => void;
  size?: number;
  iconSize?: number;
  style?: ViewStyle;
  backgroundColor?: string;
  iconColor?: string;
  hapticFeedback?: boolean;
}

export function BackButton({
  onPress,
  size = 40,
  iconSize = 24,
  style,
  backgroundColor,
  iconColor,
  hapticFeedback = true,
}: BackButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.backButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || colors.whiteTranslucent,
        },
        style,
      ]}
      onPress={handlePress}
    >
      <Ionicons
        name="arrow-back"
        size={iconSize}
        color={iconColor || colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    justifyContent: "center",
    alignItems: "center",
  },
});
