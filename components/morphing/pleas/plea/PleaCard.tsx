// components/messages/PleaCard.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { usePleaUrgencySettings } from "@/hooks/usePleaUrgencySettings";
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
  const { colors } = useTheme();
  const { urgentHoursLimit, urgentEncouragementThreshold } =
    usePleaUrgencySettings();

  const handlePress = () => {
    onPress();
  };

  // Use the parent-passed "now" for urgency, not Date.now()
  const hoursAgo =
    (now.getTime() - plea.createdAt.getTime()) / (1000 * 60 * 60);

  const isUrgent =
    hoursAgo <= urgentHoursLimit &&
    plea.encouragementCount < urgentEncouragementThreshold &&
    !plea.hasUserResponded;

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
