// components/morphing/message-thread/partnership-info/PartnershipInfoButton.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";

interface PartnershipInfoButtonProps {
  colors: any;
  onPress: () => void;
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function PartnershipInfoButton({
  colors,
  onPress,
  buttonRef,
  style,
  onPressIn,
  onPressOut,
}: PartnershipInfoButtonProps) {
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
        <IconSymbol name="info.circle" size={18} color={colors.textSecondary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 2,
    marginLeft: 6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
