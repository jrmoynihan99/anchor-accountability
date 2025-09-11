// components/IntroHeader.tsx
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { ThemedText } from "../../../components/ThemedText";

export function IntroHeader() {
  const { colors } = useTheme();

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
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ThemedText
        type="titleXLarge"
        style={[styles.title, { color: colors.text }]}
      >
        Welcome to Anchor
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
    overflow: "hidden", // Clips the image to the circle
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
