// components/messages/PleaCard.tsx
import { useTheme } from "@/context/ThemeContext";
import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { PleaCardContent } from "./PleaCardContent";

export interface PleaData {
  id: string;
  message: string;
  uid: string;
  createdAt: Date;
  encouragementCount: number;
  hasUserResponded?: boolean;
  isUrgent: boolean; // NEW: calculated in hook
}

interface PleaCardProps {
  plea: PleaData;
  now: Date;
  index: number;
  onPress: () => void;
  buttonRef?: any;
  style?: any;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function PleaCard({
  plea,
  now,
  index,
  onPress,
  buttonRef,
  style,
  onPressIn,
  onPressOut,
}: PleaCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    onPress();
  };

  // Urgency is now calculated in the hook, just use it
  const isUrgent = plea.isUrgent;

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
            borderColor: isUrgent ? colors.error : "transparent",
            shadowColor: colors.shadow,
          },
          isUrgent && styles.urgentCard,
          style,
        ]}
      >
        <PleaCardContent plea={plea} now={now} isUrgent={isUrgent} />
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
  urgentCard: {
    borderWidth: 1.5,
  },
});
