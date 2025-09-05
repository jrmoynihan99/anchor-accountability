import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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
  const { colors } = useTheme();

  return (
    <Animated.View
      style={[
        styles.shadowContainer,
        {
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={styles.textContainer}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={colors.white}
            style={{ marginRight: 8 }}
          />
          <ThemedText
            type="buttonXLarge"
            style={[styles.text, { color: colors.white }]}
          >
            Reach Out
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[
            styles.subduedText,
            {
              color: colors.white,
              letterSpacing: 0.2,
            },
          ]}
        >
          Get anonymous help
        </ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
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
    // Typography styles moved to Typography.styles.buttonXLarge
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  subduedText: {
    // Typography styles moved to Typography.styles.body + inline styles
  },
});
