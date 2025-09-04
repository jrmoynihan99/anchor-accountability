// hooks/useTabFadeAnimation.ts
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";

export function useTabFadeAnimation() {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === "ios") {
      if (isFocused) {
        // Fade in the content when tab becomes active
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150, // Faster fade in
          useNativeDriver: true,
        }).start();
      } else {
        // Fade out partially when tab becomes inactive (creates overlap)
        Animated.timing(opacity, {
          toValue: 0.3, // Don't go to 0 - creates overlap effect
          duration: 150, // Faster fade out
          useNativeDriver: true,
        }).start();
      }
    } else {
      // On non-iOS platforms, just show immediately
      opacity.setValue(1);
    }
  }, [isFocused, opacity]);

  return {
    opacity,
  };
}
