// components/messages/MyReachOutCard.tsx
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { MyReachOutCardContent } from "./MyReachOutCardContent";

export interface MyReachOutData {
  id: string;
  message: string;
  createdAt: Date;
  encouragementCount: number;
  lastEncouragementAt?: Date;
  unreadCount: number; // 👈 Add this line
}

interface MyReachOutCardProps {
  reachOut: MyReachOutData;
  index: number;
  onPress: () => void;
  now: Date; // <--- add
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function MyReachOutCard({
  reachOut,
  index,
  onPress,
  now, // <--- accept
  buttonRef,
  style,
  onPressIn,
  onPressOut,
}: MyReachOutCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    // Haptic is handled by ButtonModalTransitionBridge.open()
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={buttonRef ? 1 : 0.85}
      style={{ flex: 1 }}
    >
      <Animated.View
        ref={buttonRef}
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            borderColor: "transparent",
            shadowColor: colors.shadow,
          },
          style,
        ]}
      >
        <MyReachOutCardContent reachOut={reachOut} now={now} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
});
