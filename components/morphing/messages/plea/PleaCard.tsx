// components/messages/PleaCard.tsx
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
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
  hasUserResponded?: boolean;
}

interface PleaCardProps {
  plea: PleaData;
  now: Date; // <-- NEW
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
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  const handlePress = () => {
    onPress();
  };

  // Use the parent-passed "now" for urgency, not Date.now()
  const isUrgent =
    plea.encouragementCount === 0 && getHoursAgo(plea.createdAt, now) > 2;

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
            backgroundColor: colors.background,
            borderColor: isUrgent ? colors.error : "transparent",
            shadowColor: colors.shadow,
          },
          isUrgent && styles.urgentCard,
          style,
        ]}
      >
        {/* Pass now to PleaCardContent */}
        <PleaCardContent plea={plea} now={now} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function getHoursAgo(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
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
