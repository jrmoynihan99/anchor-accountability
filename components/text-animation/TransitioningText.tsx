import { useEffect, useRef, useState } from "react";
import { Animated, ViewStyle } from "react-native";

interface TransitioningTextProps {
  children: React.ReactNode;
  animationKey: string | number;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  slideDistance?: number;
}

export const TransitioningText = ({
  children,
  animationKey,
  style,
  duration = 200,
  slideDistance = 10,
}: TransitioningTextProps) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevKeyRef = useRef(animationKey);
  const [displayContent, setDisplayContent] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Don't re-animate if the key hasn't changed
    if (prevKeyRef.current === animationKey) {
      setDisplayContent(children);
      return;
    }

    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    // Step 1: fade/slide out current content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -slideDistance,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update content
      setDisplayContent(children);
      slideAnim.setValue(slideDistance); // reset to below

      // Step 2: fade/slide in new content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
        prevKeyRef.current = animationKey;
      });
    });
  }, [
    animationKey,
    children,
    duration,
    slideDistance,
    fadeAnim,
    slideAnim,
    isAnimating,
  ]);

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
      {displayContent}
    </Animated.View>
  );
};
