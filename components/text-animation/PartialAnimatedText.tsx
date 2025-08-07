import { useEffect, useRef, useState } from "react";
import { Animated, Text, TextStyle, View } from "react-native";

interface PartialAnimatedTextProps {
  staticText: string;
  dynamicText: string;
  animationKey: string | number;
  style?: TextStyle | TextStyle[];
  dynamicStyle?: TextStyle | TextStyle[];
  duration?: number;
  slideDistance?: number;
}

export const PartialAnimatedText = ({
  staticText,
  dynamicText,
  animationKey,
  style,
  dynamicStyle,
  duration = 150,
  slideDistance = 5,
}: PartialAnimatedTextProps) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevKeyRef = useRef(animationKey);
  const [displayDynamicText, setDisplayDynamicText] = useState(dynamicText);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Don't re-animate if the key hasn't changed
    if (prevKeyRef.current === animationKey) {
      return;
    }

    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    // Step 1: fade/slide out dynamic text
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
      // Update the dynamic content
      setDisplayDynamicText(dynamicText);
      slideAnim.setValue(slideDistance); // reset to below

      // Step 2: fade/slide in with new content
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
      <Text style={style}>{staticText}</Text>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text style={[style, dynamicStyle]}>{displayDynamicText}</Text>
      </Animated.View>
    </View>
  );
};
