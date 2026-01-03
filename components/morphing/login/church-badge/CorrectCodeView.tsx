// components/onboarding/login/church-indicator/CorrectCodeView.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface CorrectCodeViewProps {
  churchName: string;
}

export function CorrectCodeView({ churchName }: CorrectCodeViewProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View
          style={[styles.iconCircle, { backgroundColor: colors.tint + "20" }]}
        >
          <Ionicons name="checkmark-circle" size={80} color={colors.tint} />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Welcome!
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.message, { color: colors.textSecondary }]}
        >
          You can now finish making your account to join through {churchName}!
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    maxWidth: 280,
  },
});
