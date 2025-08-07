import { useEffect, useRef } from "react";
import { Animated, ViewStyle } from "react-native";

interface AppearingTextProps {
  children: React.ReactNode;
  animationKey: string | number;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  slideDistance?: number;
}

export const AppearingText = ({
  children,
  animationKey,
  style,
  duration = 200,
  slideDistance = 15,
}: AppearingTextProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(slideDistance)).current;
  const prevKeyRef = useRef<string | number | null>(null);

  useEffect(() => {
    // If this is the first render or key changed, animate in
    if (prevKeyRef.current !== animationKey) {
      // Reset to starting position
      fadeAnim.setValue(0);
      slideAnim.setValue(slideDistance);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();

      prevKeyRef.current = animationKey;
    }
  }, [animationKey, duration, slideDistance, fadeAnim, slideAnim]);

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
