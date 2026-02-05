import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SIZE = 40;

interface FloatingSettingsButtonProps {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: any;
  showAttentionBadge?: boolean;
}

export const FloatingSettingsButton = forwardRef<
  View,
  FloatingSettingsButtonProps
>(({ onPress, onPressIn, onPressOut, style, showAttentionBadge }, ref) => {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      ref={ref}
      pointerEvents="box-none"
      style={[
        styles.shadowWrapper,
        {
          shadowColor: colors.shadow,
          top: insets.top + 20, // Responsive to safe area!
          right: 24,
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
        },
        style,
      ]}
    >
      <BlurView
        intensity={40}
        tint={effectiveTheme === "dark" ? "dark" : "light"}
        style={[
          styles.blur,
          { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
        ]}
      >
        <View
          style={[
            styles.backgroundContainer,
            {
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              backgroundColor: colors.navBackground,
              borderColor: colors.navBorder,
              borderWidth: 1,
            },
          ]}
        >
          <Pressable
            style={[
              styles.button,
              {
                width: SIZE,
                height: SIZE,
                borderRadius: SIZE / 2,
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
        </View>
      </BlurView>
      {showAttentionBadge && (
        <View style={styles.attentionBadge}>
          <Text style={styles.attentionBadgeText}>!</Text>
        </View>
      )}
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
  backgroundContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  attentionBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    zIndex: 3,
  },
  attentionBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
});
