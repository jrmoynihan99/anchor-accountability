// components/morphing/message-thread/accountability/AccountabilityInviteButton.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useImperativeHandle } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AccountabilityInviteButtonProps {
  colors: any;
  onPress?: () => void;
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
  pulseRef?: React.RefObject<{ pulse: () => void } | null>;
  variant?:
    | "invite"
    | "partner"
    | "pending-sent"
    | "pending-received"
    | "declined"; // ✅ NEW
}

export const AccountabilityInviteButton = React.forwardRef<
  any,
  AccountabilityInviteButtonProps
>(
  (
    {
      colors,
      onPress,
      buttonRef,
      style,
      onPressIn,
      onPressOut,
      pulseRef,
      variant = "invite",
    },
    ref
  ) => {
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);

    // Determine icon, colors, and behavior based on variant
    const getIconConfig = () => {
      switch (variant) {
        case "partner":
          return {
            name: "person.2.fill" as const,
            size: 24,
            color: colors.tint,
            backgroundColor: colors.iconCircleSecondaryBackground,
            showGlow: false,
            showBadge: false,
          };
        case "pending-sent":
          return {
            name: "clock.fill" as const,
            size: 20,
            color: colors.white,
            backgroundColor: "#FF9500", // Orange
            showGlow: false,
            showBadge: false,
          };
        case "pending-received":
          return {
            name: "bell.badge.fill" as const,
            size: 20,
            color: colors.white,
            backgroundColor: "#34C759", // Green
            showGlow: false,
            showBadge: true, // Show notification badge
          };
        case "declined": // ✅ NEW
          return {
            name: "xmark.circle.fill" as const,
            size: 20,
            color: colors.white,
            backgroundColor: colors.textSecondary || "#8E8E93", // Gray
            showGlow: false,
            showBadge: true, // Show badge to indicate needs acknowledgment
          };
        case "invite":
        default:
          return {
            name: "person.badge.plus" as const,
            size: 20,
            color: colors.textSecondary,
            backgroundColor: colors.iconCircleSecondaryBackground,
            showGlow: true,
            showBadge: false,
          };
      }
    };

    const iconConfig = getIconConfig();

    // Expose pulse function via pulseRef (only for invite variant)
    useImperativeHandle(pulseRef, () => ({
      pulse: () => {
        if (variant !== "invite") return; // Don't pulse other variants

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
        disabled={!onPress} // Disable if no onPress (for buttonContent)
      >
        <Animated.View style={[styles.container, animatedButtonStyle]}>
          {/* Glow ring - only for invite variant */}
          {iconConfig.showGlow && (
            <Animated.View
              style={[
                styles.glowRing,
                {
                  borderColor: colors.tint,
                },
                animatedGlowStyle,
              ]}
            />
          )}

          {/* Main button */}
          <Animated.View
            ref={buttonRef}
            style={[
              styles.iconContainer,
              {
                backgroundColor: iconConfig.backgroundColor,
                borderColor:
                  variant === "partner" ? colors.border : "transparent",
                borderWidth: variant === "partner" ? 1 : 0,
              },
              style,
            ]}
          >
            <IconSymbol
              name={iconConfig.name}
              size={iconConfig.size}
              color={iconConfig.color}
            />
          </Animated.View>

          {/* Notification badge - for pending-received and declined */}
          {iconConfig.showBadge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: "#FF3B30", // Red notification badge
                  borderColor: colors.background,
                },
              ]}
            />
          )}
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
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
