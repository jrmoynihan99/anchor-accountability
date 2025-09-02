// components/AnonymousBadge.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";

interface AnonymousBadgeProps {
  // ButtonModalTransitionBridge props
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  // Custom props
  text?: string;
}

export function AnonymousBadge({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
  text = "What's this?",
}: AnonymousBadgeProps) {
  const { colors } = useTheme();

  // If we have modal bridge props, make it touchable
  if (onPress && buttonRef) {
    return (
      <Animated.View style={style}>
        <TouchableOpacity
          ref={buttonRef}
          style={[
            styles.anonymousBadge,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.8}
        >
          <IconSymbol
            name="questionmark.circle"
            size={14}
            color={colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <ThemedText
            type="badge"
            style={[styles.anonymousBadgeText, { color: colors.textSecondary }]}
          >
            {text}
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Otherwise, render as a regular non-touchable badge
  return (
    <View
      style={[
        styles.anonymousBadge,
        {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
        },
      ]}
    >
      <IconSymbol
        name="eye.slash"
        size={14}
        color={colors.textSecondary}
        style={{ marginRight: 6 }}
      />
      <ThemedText
        type="badge"
        style={[styles.anonymousBadgeText, { color: colors.textSecondary }]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  anonymousBadge: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  anonymousBadgeText: {
    // Typography styles handled by ThemedText type="badge"
  },
});
