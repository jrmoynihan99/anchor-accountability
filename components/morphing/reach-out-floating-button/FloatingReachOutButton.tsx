import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const PILL_WIDTH = 320;
const PILL_HEIGHT = 100;

interface FloatingReachOutButtonProps {
  buttonRef: any;
  style?: any;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function FloatingReachOutButton({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: FloatingReachOutButtonProps) {
  // Position the floating button
  const fabLeft = (screenWidth - PILL_WIDTH) / 2;
  const fabTop = screenHeight - PILL_HEIGHT - 100;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: fabLeft,
          top: fabTop,
          width: PILL_WIDTH,
          height: PILL_HEIGHT,
        },
        style,
      ]}
    >
      <TouchableOpacity
        ref={buttonRef}
        style={styles.button}
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
          <Text style={styles.pillText}>Reach Out</Text>
        </View>
        <Text style={styles.subduedText}>Get instant anonymous help</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 20,
    // Shadow properties
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 7,
    backgroundColor: "#CBAD8D",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22,
    letterSpacing: 0.3,
  },
  subduedText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
