import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";

interface ReachOutButtonProps {
  buttonRef: any;
  style?: any;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function ReachOutButton({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: ReachOutButtonProps) {
  const theme = useColorScheme();
  const accent = Colors[theme ?? "dark"].tint;

  return (
    <Animated.View style={[styles.shadowContainer, style]}>
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.button, { backgroundColor: accent }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.textContainer}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.text}>Reach Out</Text>
        </View>
        <Text style={styles.subduedText}>Get anonymous help</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 20,
  },
  button: {
    paddingVertical: 100,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  text: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  subduedText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
