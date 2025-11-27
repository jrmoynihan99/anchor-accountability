// components/messages/chat/InfoButton.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface InfoButtonProps {
  colors: any;
  onPress: () => void;
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function InfoButton({
  colors,
  onPress,
  buttonRef,
  style,
  onPressIn,
  onPressOut,
}: InfoButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={buttonRef ? 1 : 0.7}
      style={styles.button}
    >
      <Animated.View
        ref={buttonRef}
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.iconCircleSecondaryBackground,
          },
          style,
        ]}
      >
        <IconSymbol name="info.circle" size={24} color={colors.textSecondary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
    marginLeft: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
