import { useEffect, useRef, useState } from "react";
import { Animated, ViewStyle } from "react-native";

interface FadeInTextProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  slideDistance?: number;
  onComplete?: () => void;
  style?: ViewStyle | ViewStyle[];
  ready?: boolean;
}

export function FadeInText({
  children,
  delay = 0,
  duration = 600,
  slideDistance = 12,
  onComplete,
  style,
  ready = true,
}: FadeInTextProps) {
  const [started, setStarted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(slideDistance)).current;

  useEffect(() => {
    if (!ready) return;

    if (delay > 0) {
      const timer = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(timer);
    } else {
      setStarted(true);
    }
  }, [ready, delay]);

  useEffect(() => {
    if (!started) return;

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
    ]).start(({ finished }) => {
      if (finished) {
        onComplete?.();
      }
    });
  }, [started]);

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
}
