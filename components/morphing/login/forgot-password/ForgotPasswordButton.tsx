// components/morphing/login/forgot-password/ForgotPasswordButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface ForgotPasswordButtonProps {
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function ForgotPasswordButton({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: ForgotPasswordButtonProps) {
  const { colors } = useTheme();

  // Touchable button (with modal bridge)
  if (onPress && buttonRef) {
    return (
      <Animated.View style={style}>
        <TouchableOpacity
          ref={buttonRef}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.container}
          activeOpacity={0.7}
        >
          <ThemedText
            type="caption"
            style={[styles.clickableText, { color: colors.textSecondary }]}
          >
            Forgot Password?
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Static button (shouldn't be used, but as fallback)
  return (
    <ThemedText
      type="caption"
      style={[styles.clickableText, { color: colors.textSecondary }, style]}
    >
      Forgot Password?
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  clickableText: {
    textDecorationLine: "underline",
  },
});
