import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface PrivacyPolicyBadgeProps {
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function PrivacyPolicyBadge({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: PrivacyPolicyBadgeProps) {
  const { colors } = useTheme();

  // Touchable badge (with modal bridge)
  if (onPress && buttonRef) {
    return (
      <Animated.View style={style}>
        <TouchableOpacity
          ref={buttonRef}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.7}
        >
          <ThemedText
            type="small"
            style={[styles.clickableText, { color: colors.textSecondary }]}
          >
            Privacy Policy
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Static badge (shouldn't be used, but as fallback)
  return (
    <ThemedText
      type="small"
      style={[styles.clickableText, { color: colors.textSecondary }, style]}
    >
      Privacy Policy
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  clickableText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
