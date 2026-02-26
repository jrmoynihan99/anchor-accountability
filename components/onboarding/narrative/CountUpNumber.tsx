import { useTheme } from "@/context/ThemeContext";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const RING_SIZE = 200;
const STROKE_WIDTH = 5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CountUpNumberProps {
  target: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  onComplete?: () => void;
}

export function CountUpNumber({
  target,
  duration = 1200,
  delay = 0,
  suffix = "",
  onComplete,
}: CountUpNumberProps) {
  const { colors } = useTheme();
  const [displayValue, setDisplayValue] = useState(0);
  const [ringOffset, setRingOffset] = useState(CIRCUMFERENCE);
  const animatedValue = useSharedValue(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetFraction = Math.min(target, 100) / 100;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      const updateDisplay = (value: number) => {
        const rounded = Math.round(value);
        setDisplayValue(rounded);
        const fraction = Math.min(rounded, 100) / 100;
        setRingOffset(CIRCUMFERENCE * (1 - fraction));
      };

      const handleComplete = () => {
        setDisplayValue(target);
        setRingOffset(CIRCUMFERENCE * (1 - targetFraction));
        onComplete?.();
      };

      const interval = setInterval(() => {
        runOnJS(updateDisplay)(animatedValue.value);
      }, 16);

      animatedValue.value = withTiming(
        target,
        {
          duration,
          easing: Easing.out(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(handleComplete)();
          }
        },
      );

      // Store interval for cleanup
      intervalRef.current = interval;
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [target, duration, delay]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svg}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={ringOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={[styles.number, { color: colors.text }]}>
          {displayValue}
          {suffix}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  textContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontSize: 72,
    fontWeight: "700",
    textAlign: "center",
  },
});
