// components/IntroHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";

export function IntroHeader() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.iconCircleSecondaryBackground,
            borderColor: `${colors.icon}33`, // Adding 33 for 20% opacity
          },
        ]}
      >
        <Ionicons name="shield-checkmark" size={32} color={colors.icon} />
      </View>
      <ThemedText
        type="titleXLarge"
        style={[styles.title, { color: colors.text }]}
      >
        Welcome to Haven
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
