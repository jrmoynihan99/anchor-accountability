import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { formatTime } from "./prayerUtils";

interface PrayerTimerProps {
  duration: number; // Duration in seconds
  isActive: boolean; // Whether the timer should be running
  onComplete: () => void; // Called when timer reaches 0
  color: string; // Color for the timer text and progress bar
}

export function PrayerTimer({
  duration,
  isActive,
  onComplete,
  color,
}: PrayerTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [progressAnim] = useState(new Animated.Value(100)); // Start at 100%

  // Reset timer when duration changes OR when isActive becomes true
  useEffect(() => {
    setTimeRemaining(duration);
    progressAnim.setValue(100); // Reset progress bar to full
  }, [duration]);

  // Reset timer when becoming active (starting a new step)
  useEffect(() => {
    if (isActive) {
      setTimeRemaining(duration);
      progressAnim.setValue(100); // Reset progress bar to full
    }
  }, [isActive, duration]);

  // Timer countdown logic with single smooth animation
  useEffect(() => {
    let interval: number;

    if (isActive && timeRemaining > 0) {
      // Start a single smooth animation for the entire duration
      if (timeRemaining === duration) {
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: duration * 1000, // Total duration in milliseconds
          useNativeDriver: false,
        }).start();
      }

      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, onComplete, duration, progressAnim]);

  return (
    <View style={styles.timerContainer}>
      <Text style={[styles.timerText, { color }]}>
        {formatTime(timeRemaining)}
      </Text>
      <View style={styles.timerProgress}>
        <Animated.View
          style={[
            styles.timerProgressFill,
            {
              backgroundColor: color,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 12,
  },
  timerProgress: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(139, 105, 20, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  timerProgressFill: {
    height: "100%",
    borderRadius: 3,
    alignSelf: "flex-end",
  },
});
