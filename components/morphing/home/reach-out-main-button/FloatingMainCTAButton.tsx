import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import { Dimensions, Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloatingMainCTAButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
  iconSize?: number;
  borderWidth?: number;
  style?: any; // <-- to support morphing/animation
  onPressIn?: () => void; // <-- for modal transition scaling
  onPressOut?: () => void; // <-- for modal transition scaling
}

// ---- Defaults ----
const DEFAULT_SIZE = 70;
const DEFAULT_ICON_SIZE = 38;
const DEFAULT_BORDER_WIDTH = 1; // To match pill nav

export const FloatingMainCTAButton = forwardRef<
  any,
  FloatingMainCTAButtonProps
>(
  (
    {
      onPress,
      size = DEFAULT_SIZE,
      color,
      iconSize = DEFAULT_ICON_SIZE,
      borderWidth = DEFAULT_BORDER_WIDTH,
      style,
      onPressIn,
      onPressOut,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
      <Animated.View
        ref={ref}
        pointerEvents="box-none"
        style={[
          styles.absoluteContainer,
          {
            bottom: insets.bottom + 10,
            left: Dimensions.get("window").width / 2 - size / 2,
            width: size,
            height: size,
          },
          style, // Apply animated style to the same element as the ref
        ]}
      >
        <Pressable
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color || colors.tint,
              borderColor: colors.navBorder,
              borderWidth,
              shadowColor: colors.shadow,
              shadowOpacity: 0.35,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 12,
              elevation: 5,
            },
          ]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          hitSlop={12}
        >
          <Ionicons
            name="shield-checkmark"
            size={iconSize}
            color={colors.white}
          />
        </Pressable>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  absoluteContainer: {
    position: "absolute",
    zIndex: 2024,
    justifyContent: "center",
    alignItems: "center",
    // width and height set inline
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    // other styles set inline
  },
});
