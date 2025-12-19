import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";

export function CreatePostConfirmationScreen() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${colors.iconCircleBackground}50` },
        ]}
      >
        <IconSymbol name="checkmark" size={36} color={colors.icon} />
      </View>
      <ThemedText
        type="title"
        style={{ color: colors.text, marginTop: 20, textAlign: "center" }}
      >
        Post Created!
      </ThemedText>
      <ThemedText
        type="body"
        style={{
          color: colors.textSecondary,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Your post has been created!
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
