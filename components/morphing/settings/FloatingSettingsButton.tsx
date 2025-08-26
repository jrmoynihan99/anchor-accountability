import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { forwardRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

const SIZE = 40;

interface FloatingSettingsButtonProps {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: any;
}

export const FloatingSettingsButton = forwardRef<
  View,
  FloatingSettingsButtonProps
>(({ onPress, onPressIn, onPressOut, style }, ref) => {
  const { colors, effectiveTheme } = useTheme();

  return (
    <Animated.View
      ref={ref}
      pointerEvents="box-none"
      style={[
        styles.shadowWrapper,
        {
          shadowColor: colors.shadow,
          top: 64,
          right: 24,
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
        },
        style,
      ]}
    >
      <BlurView
        intensity={80}
        tint={effectiveTheme === "dark" ? "dark" : "light"}
        style={[
          styles.blur,
          { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
        ]}
      >
        <Pressable
          style={[
            styles.button,
            {
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              borderColor: colors.navBorder,
              borderWidth: 1,
            },
          ]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          hitSlop={12}
        >
          <Ionicons
            name="settings-sharp"
            size={24}
            color={colors.tabIconDefault}
          />
        </Pressable>
      </BlurView>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  shadowWrapper: {
    position: "absolute",
    zIndex: 2002,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: "transparent",
  },
  blur: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
