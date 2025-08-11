// components/LoginHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackPress();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: colors.whiteTranslucent },
        ]}
        onPress={handleBackPress}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  title: {
    fontWeight: "600",
    flex: 1,
  },
});
