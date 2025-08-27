// components/community/CreatePostFAB.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { EdgeInsets } from "react-native-safe-area-context";

interface CreatePostFABProps {
  onPress: () => void;
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
  insets: EdgeInsets;
}

export function CreatePostFAB({
  onPress,
  buttonRef,
  style,
  onPressIn,
  onPressOut,
  insets,
}: CreatePostFABProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = () => {
    onPress();
  };

  const handlePressIn = () => {
    if (onPressIn) onPressIn();
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    if (onPressOut) onPressOut();
    scale.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={buttonRef ? 1 : 0.9}
      style={[
        styles.fabContainer,
        {
          bottom: insets.bottom + 100,
        },
      ]}
    >
      <Animated.View
        ref={buttonRef}
        style={[
          styles.fab,
          {
            backgroundColor: colors.buttonBackground,
            shadowColor: colors.shadow,
          },
          animatedStyle,
          style, // This will contain the transition animation styles
        ]}
      >
        <IconSymbol name="plus" size={28} color={colors.white} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
});
