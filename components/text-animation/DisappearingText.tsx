import { useEffect, useRef, useState } from "react";
import { Animated, ViewStyle } from "react-native";

interface DisappearingTextProps {
  children: React.ReactNode;
  shouldDisappear: boolean;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  slideDistance?: number;
  onDisappearComplete?: () => void;
}

export const DisappearingText = ({
  children,
  shouldDisappear,
  style,
  duration = 200,
  slideDistance = 15,
  onDisappearComplete,
}: DisappearingTextProps) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (shouldDisappear && isVisible) {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -slideDistance,
          duration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
        onDisappearComplete?.();
      });
    }
  }, [
    shouldDisappear,
    isVisible,
    duration,
    slideDistance,
    fadeAnim,
    slideAnim,
    onDisappearComplete,
  ]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};
