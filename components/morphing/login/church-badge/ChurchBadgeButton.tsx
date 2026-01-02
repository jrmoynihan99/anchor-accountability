// components/onboarding/church-selection/church-badge/ChurchBadgeButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface ChurchBadgeButtonProps {
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  churchName: string;
}

export function ChurchBadgeButton({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
  churchName,
}: ChurchBadgeButtonProps) {
  const { colors } = useTheme();

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        ref={buttonRef}
        style={[
          styles.churchBadge,
          {
            backgroundColor: colors.cardBackground,
          },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.8}
      >
        <IconSymbol name="building.2" size={20} color={colors.icon} />
        <ThemedText type="bodyMedium" style={{ color: colors.text }}>
          {churchName}
        </ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  churchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    alignSelf: "center",
  },
});
