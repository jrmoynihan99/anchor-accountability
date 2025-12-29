// hooks/useTabFadeAnimation.ts
import { useIsFocused, useRoute } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";

export function useTabFadeAnimation() {
  const isFocused = useIsFocused();
  const route = useRoute();
  const opacity = useRef(new Animated.Value(1)).current;

  // Track if this is a tab screen
  const isTabScreen = ["index", "pleas", "messages", "community"].includes(
    route.name
  );

  // Track previous focus state to detect tab-to-tab switches only
  const previousFocused = useRef(isFocused);
  const wasTabScreen = useRef(isTabScreen);

  useEffect(() => {
    if (Platform.OS === "ios" && isTabScreen) {
      // Only animate if we're switching between two tab screens
      const isTabToTabSwitch =
        wasTabScreen.current &&
        isTabScreen &&
        previousFocused.current !== isFocused;

      if (isFocused) {
        if (isTabToTabSwitch) {
          // Only animate on tab-to-tab switch
          Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
        } else {
          // Immediate show for stack-to-tab navigation
          opacity.setValue(1);
        }
      } else {
        if (isTabToTabSwitch) {
          // Only animate on tab-to-tab switch
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 80,
            useNativeDriver: true,
          }).start();
        }
        // Don't animate when going to stack screens
      }
    } else {
      opacity.setValue(1);
    }

    // Update previous state
    previousFocused.current = isFocused;
    wasTabScreen.current = isTabScreen;
  }, [isFocused, isTabScreen, opacity]);

  return {
    opacity,
  };
}
