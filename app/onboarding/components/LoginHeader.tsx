// components/LoginHeader.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { BackButton } from "../../../components/BackButton";
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";

interface LoginHeaderProps {
  isSignUp: boolean;
  onBackPress: () => void;
}

export function LoginHeader({ isSignUp, onBackPress }: LoginHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.header}>
      <BackButton onPress={onBackPress} style={styles.backButtonSpacing} />

      <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
        {isSignUp ? "Create Account" : "Welcome Back"}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButtonSpacing: {
    marginRight: 16,
  },
  title: {
    fontWeight: "600",
    flex: 1,
  },
});
