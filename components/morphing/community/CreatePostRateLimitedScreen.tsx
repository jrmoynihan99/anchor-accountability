// components/morphing/home/create-post-main-button/CreatePostRateLimitedScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface CreatePostRateLimitedScreenProps {
  waitTimeMs: number;
  onClose: () => void;
  onTimeExpired?: () => void; // ADD THIS - callback when timer expires
}

export function CreatePostRateLimitedScreen({
  waitTimeMs,
  onClose,
  onTimeExpired,
}: CreatePostRateLimitedScreenProps) {
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (waitTimeMs > 0) {
      setCountdown(Math.ceil(waitTimeMs / 1000));

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Defer the callback to avoid setState during render
            if (onTimeExpired) {
              setTimeout(onTimeExpired, 0);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [waitTimeMs, onTimeExpired]);

  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `${secs}s`;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Header with Clock Icon */}
      <View style={styles.modalHeader}>
        <View
          style={[
            styles.clockContainer,
            { backgroundColor: colors.warning + "20" },
          ]}
        >
          <Ionicons name="time" size={40} color={colors.text} />
        </View>
        <ThemedText
          type="titleLarge"
          style={[
            {
              color: colors.text,
              marginTop: 16,
              textAlign: "center",
            },
          ]}
        >
          You've Posted Recently
        </ThemedText>
      </View>

      <ThemedText
        type="body"
        style={[
          {
            color: colors.textMuted,
            lineHeight: 22,
            textAlign: "center",
            marginBottom: 32,
          },
        ]}
      >
        In order to prevent spam, we've limited posting times! Thanks :)
      </ThemedText>

      {/* Countdown Display */}
      <View
        style={[
          styles.countdownContainer,
          { backgroundColor: colors.cardBackground },
        ]}
      >
        <ThemedText
          type="body"
          style={[{ color: colors.text, textAlign: "center" }]}
        >
          You can post again in
        </ThemedText>
        <ThemedText
          type="titleLarge"
          style={[{ color: colors.text, marginTop: 8, textAlign: "center" }]}
        >
          {formatTime(countdown)}
        </ThemedText>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: colors.text }]}
        onPress={handleClosePress}
      >
        <ThemedText type="buttonLarge" style={[{ color: colors.background }]}>
          Close
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  clockContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  closeButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
