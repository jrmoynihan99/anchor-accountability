// components/messages/chat/AccountabilityInviteButton.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface AccountabilityInviteButtonProps {
  colors: any;
  onPress: () => void;
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function AccountabilityInviteButton({
  colors,
  onPress,
  buttonRef,
  style,
  onPressIn,
  onPressOut,
}: AccountabilityInviteButtonProps) {
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
            borderColor: colors.border,
          },
          style,
        ]}
      >
        <IconSymbol
          name="person.badge.plus"
          size={20}
          color={colors.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    // No padding - let the parent control spacing
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
