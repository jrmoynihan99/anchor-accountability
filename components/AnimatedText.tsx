import { useEffect, useRef, useState } from "react";
import { Animated, ViewStyle } from "react-native";

interface AnimatedTextProps {
  children: React.ReactNode;
  animationKey: string | number;
  style?: ViewStyle | ViewStyle[];
  duration?: number;
  slideDistance?: number;
}

export const AnimatedText = ({
  children,
  animationKey,
  style,
  duration = 150,
  slideDistance = 5,
}: AnimatedTextProps) => {
  console.log("[AnimatedText] MOUNT", animationKey);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevKeyRef = useRef(animationKey);
  const [displayContent, setDisplayContent] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    console.log("[AnimatedText] UNMOUNT", animationKey);
    console.log(
      `[AnimatedText] Render: animationKey="${animationKey}", prevKey="${prevKeyRef.current}"`
    );

    // Don't re-animate if the key hasn't changed
    if (prevKeyRef.current === animationKey) {
      console.log("[AnimatedText] No animation: animationKey unchanged");
      return;
    }

    if (isAnimating) {
      console.log("[AnimatedText] Skipping: already animating");
      return;
    }

    console.log("[AnimatedText] Starting animation...");
    setIsAnimating(true);

    // Step 1: fade/slide out
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
      console.log("[AnimatedText] Step 1 complete, updating content");

      setDisplayContent(children);
      slideAnim.setValue(slideDistance); // reset to below

      // Step 2: fade/slide in
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
        console.log("[AnimatedText] Animation complete");
        setIsAnimating(false);
        prevKeyRef.current = animationKey; // update last used key
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
