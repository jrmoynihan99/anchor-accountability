// components/messages/PleaCard.tsx
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { PleaCardContent } from "./PleaCardContent";

export interface PleaData {
  id: string;
  message: string;
  uid: string;
  createdAt: Date;
  encouragementCount: number;
  hasUserResponded?: boolean; // New field to track if current user responded
}

interface PleaCardProps {
  plea: PleaData;
  index: number;
  onPress: () => void;
  // New props for modal support
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function PleaCard({
  plea,
  index,
  onPress,
  buttonRef,
  style,
  onPressIn,
  onPressOut,
}: PleaCardProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Determine urgency based on encouragement count and time
  const isUrgent =
    plea.encouragementCount === 0 && getHoursAgo(plea.createdAt) > 2;

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
            borderColor: isUrgent ? colors.error : "transparent",
            shadowColor: colors.shadow,
          },
          isUrgent && styles.urgentCard,
          style,
        ]}
      >
        <PleaCardContent plea={plea} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function getHoursAgo(date: Date): number {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  return diffInMilliseconds / (1000 * 60 * 60);
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
  urgentCard: {
    borderWidth: 1.5,
  },
});
