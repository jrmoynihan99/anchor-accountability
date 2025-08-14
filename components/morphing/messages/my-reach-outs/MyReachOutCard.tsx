// components/messages/MyReachOutCard.tsx
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
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
}

interface MyReachOutCardProps {
  reachOut: MyReachOutData;
  index: number;
  onPress: () => void;
  // New props for modal support
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function MyReachOutCard({
  reachOut,
  index,
  onPress,
  buttonRef,
  style,
  onPressIn,
  onPressOut,
}: MyReachOutCardProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={buttonRef ? 1 : 0.85} // Use activeOpacity 1 when using modal bridge
      style={{ flex: 1 }}
    >
      <Animated.View
        ref={buttonRef}
        style={[
          styles.card,
          {
            backgroundColor: colors.background,
            borderColor: "transparent",
            shadowColor: colors.shadow,
          },
          style,
        ]}
      >
        <MyReachOutCardContent reachOut={reachOut} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
});
