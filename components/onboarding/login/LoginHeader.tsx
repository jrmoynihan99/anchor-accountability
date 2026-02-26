// components/LoginHeader.tsx
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { BackButton } from "../../BackButton";
import { ThemedText } from "../../ThemedText";

interface LoginHeaderProps {
  isSignUp: boolean;
  onBackPress: () => void;
  showBack?: boolean;
}

export function LoginHeader({ isSignUp, onBackPress, showBack = true }: LoginHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, !showBack && styles.headerCentered]}>
      {showBack && (
        <BackButton onPress={onBackPress} style={styles.backButtonSpacing} />
      )}

      <ThemedText
        type="title"
        style={[styles.title, !showBack && styles.titleCentered, { color: colors.text }]}
      >
        {isSignUp ? "Create Account" : "Welcome Back"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 32,
  },
  backButtonSpacing: {
    marginRight: 16,
  },
  title: {
    fontWeight: "600",
    flex: 1,
  },
  headerCentered: {
    justifyContent: "center" as const,
  },
  titleCentered: {
    textAlign: "center" as const,
  },
});
