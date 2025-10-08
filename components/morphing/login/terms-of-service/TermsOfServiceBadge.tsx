import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface TermsOfServiceBadgeProps {
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function TermsOfServiceBadge({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: TermsOfServiceBadgeProps) {
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
            Terms of Service
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
      Terms of Service
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  clickableText: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
