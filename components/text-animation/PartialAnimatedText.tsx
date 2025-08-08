// components/text-animation/PartialAnimatedText.tsx
import { ThemedText, type ThemedTextProps } from "@/components/ThemedText";
import { useEffect, useRef, useState } from "react";
import { Animated, TextStyle, View } from "react-native";

interface PartialAnimatedTextProps {
  staticText: string;
  dynamicText: string;
  animationKey: string | number;

  /** Typography + styling */
  type?: ThemedTextProps["type"];
  style?: TextStyle | TextStyle[];
  dynamicStyle?: TextStyle | TextStyle[];

  /** Optional explicit colors (handy to avoid putting color in style) */
  lightColor?: string;
  darkColor?: string;
  dynamicLightColor?: string;
  dynamicDarkColor?: string;

  /** Animation config */
  duration?: number; // per phase (out/in)
  slideDistance?: number; // px up/down for the dynamic portion
}

export const PartialAnimatedText = ({
  staticText,
  dynamicText,
  animationKey,
  type = "body",
  style,
  dynamicStyle,
  lightColor,
  darkColor,
  dynamicLightColor,
  dynamicDarkColor,
  duration = 150,
  slideDistance = 5,
}: PartialAnimatedTextProps) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevKeyRef = useRef(animationKey);
  const [displayDynamicText, setDisplayDynamicText] = useState(dynamicText);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // bail if no change or mid-animation
    if (prevKeyRef.current === animationKey || isAnimating) return;

    setIsAnimating(true);

    // Phase 1: fade/slide out
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
      // swap text + reset position
      setDisplayDynamicText(dynamicText);
      slideAnim.setValue(slideDistance);

      // Phase 2: fade/slide in
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
    });
  }, [
    animationKey,
    dynamicText,
    duration,
    slideDistance,
    fadeAnim,
    slideAnim,
    isAnimating,
  ]);

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
      <ThemedText
        type={type}
        style={style}
        lightColor={lightColor}
        darkColor={darkColor}
      >
        {staticText}
      </ThemedText>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ThemedText
          type={type}
          style={dynamicStyle ?? style}
          lightColor={dynamicLightColor ?? lightColor}
          darkColor={dynamicDarkColor ?? darkColor}
        >
          {displayDynamicText}
        </ThemedText>
      </Animated.View>
    </View>
  );
};
