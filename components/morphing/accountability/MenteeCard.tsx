import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { CheckInStatus } from "./accountabilityUtils";
import { MenteeCardContent } from "./MenteeCardContent";

interface MenteeCardProps {
  menteeUid: string;
  recoveryStreak: number;
  checkInStreak: number;
  checkInStatus: CheckInStatus;
  menteeTimezone?: string;
  onMessage?: () => void;
  // ButtonModalTransitionBridge props
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function MenteeCard({
  menteeUid,
  recoveryStreak,
  checkInStreak,
  checkInStatus,
  menteeTimezone,
  onMessage,
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: MenteeCardProps) {
  const { colors } = useTheme();

  // If we have modal bridge props, make it touchable
  if (onPress && buttonRef) {
    return (
      <Animated.View style={style}>
        <TouchableOpacity
          ref={buttonRef}
          style={[styles.container, { backgroundColor: colors.cardBackground }]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <MenteeCardContent
            menteeUid={menteeUid}
            recoveryStreak={recoveryStreak}
            checkInStreak={checkInStreak}
            checkInStatus={checkInStatus}
            menteeTimezone={menteeTimezone}
            showExpandIcon={true}
            onMessage={onMessage}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Otherwise, render as a regular non-touchable card
  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <MenteeCardContent
        menteeUid={menteeUid}
        recoveryStreak={recoveryStreak}
        checkInStreak={checkInStreak}
        checkInStatus={checkInStatus}
        showExpandIcon={true}
        onMessage={onMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
});
