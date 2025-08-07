import { useEffect, useRef, useState } from "react";
import { Animated, ViewStyle } from "react-native";

interface ConditionalAnimatedTextProps {
  children: React.ReactNode;
  show: boolean;
  animationKey: string | number;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  slideDistance?: number;
}

export const ConditionalAnimatedText = ({
  children,
  show,
  animationKey,
  style,
  duration = 200,
  slideDistance = 15,
}: ConditionalAnimatedTextProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(slideDistance)).current;
  const [isVisible, setIsVisible] = useState(false);
  const [displayContent, setDisplayContent] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevKeyRef = useRef(animationKey);

  useEffect(() => {
    // Handle showing/hiding
    if (show && !isVisible && !isAnimating) {
      setIsAnimating(true);
      setIsVisible(true);
      setDisplayContent(children);

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
      ]).start(() => {
        setIsAnimating(false);
        prevKeyRef.current = animationKey;
      });
    } else if (!show && isVisible && !isAnimating) {
      setIsAnimating(true);

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
        setIsAnimating(false);
      });
    } else if (
      show &&
      isVisible &&
      prevKeyRef.current !== animationKey &&
      !isAnimating
    ) {
      // Content is changing while visible - do a change animation
      setIsAnimating(true);

      // Step 1: fade/slide out
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
        slideAnim.setValue(slideDistance);

        // Step 2: fade/slide in
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
    }
  }, [
    show,
    animationKey,
    children,
    isVisible,
    isAnimating,
    duration,
    slideDistance,
    fadeAnim,
    slideAnim,
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
      {displayContent}
    </Animated.View>
  );
};
