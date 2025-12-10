// components/messages/chat/AccountabilityInviteButton.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useImperativeHandle } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AccountabilityInviteButtonProps {
  colors: any;
  onPress: () => void;
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
  pulseRef?: React.RefObject<{ pulse: () => void } | null>;
}

export const AccountabilityInviteButton = React.forwardRef<
  any,
  AccountabilityInviteButtonProps
>(
  (
    { colors, onPress, buttonRef, style, onPressIn, onPressOut, pulseRef },
    ref
  ) => {
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    // Expose pulse function via pulseRef
    useImperativeHandle(pulseRef, () => ({
      pulse: () => {
        // Two pulses: scale + glow
        scale.value = withSequence(
          withTiming(1.15, { duration: 200 }),
          withTiming(1.0, { duration: 200 }),
          withTiming(1.15, { duration: 200 }),
          withTiming(1.0, { duration: 200 })
        );

        glowOpacity.value = withSequence(
          withTiming(0.6, { duration: 200 }),
          withTiming(0, { duration: 200 }),
          withTiming(0.6, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
      },
    }));

    const animatedButtonStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
      opacity: glowOpacity.value,
    }));

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={buttonRef ? 1 : 0.7}
        style={styles.button}
      >
        <Animated.View style={[styles.container, animatedButtonStyle]}>
          {/* Glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: colors.tint,
              },
              animatedGlowStyle,
            ]}
          />

          {/* Main button */}
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
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

AccountabilityInviteButton.displayName = "AccountabilityInviteButton";

const styles = StyleSheet.create({
  button: {
    // No padding - let the parent control spacing
  },
  container: {
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    top: -4,
    left: -4,
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
