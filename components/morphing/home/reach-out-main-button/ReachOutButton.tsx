import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
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
    <Animated.View style={style}>
      <TouchableOpacity
        ref={buttonRef}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.container,
          { backgroundColor: colors.tint, shadowColor: colors.shadow },
        ]}
      >
        <View style={styles.textContainer}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={colors.white}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="buttonXLarge" style={{ color: colors.white }}>
            Reach Out
          </ThemedText>
        </View>

        <ThemedText
          type="body"
          style={{ color: colors.white, letterSpacing: 0.2 }}
        >
          Get anonymous help
        </ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 100, // OPTION B — preserve original huge padding
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",

    // iOS shadows
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,

    // Android shadows
    elevation: 5,
  },

  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
});
