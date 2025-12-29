import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { CheckInStatus } from "../../accountability/accountabilityUtils";
import { MentorCardCompactContent } from "./MentorCardCompactContent";

interface MentorCardCompactProps {
  mentorUid: string;
  streak: number;
  checkInStatus: CheckInStatus;
  mentorTimezone?: string;
  onCheckIn?: () => void;
  onMessage?: () => void;
  // ButtonModalTransitionBridge props
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function MentorCardCompact({
  mentorUid,
  streak,
  checkInStatus,
  mentorTimezone,
  onCheckIn,
  onMessage,
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: MentorCardCompactProps) {
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
          <MentorCardCompactContent
            mentorUid={mentorUid}
            streak={streak}
            checkInStatus={checkInStatus}
            mentorTimezone={mentorTimezone}
            onCheckIn={onCheckIn}
            onMessage={onMessage}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            showExpandIcon={true}
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
      <MentorCardCompactContent
        mentorUid={mentorUid}
        streak={streak}
        checkInStatus={checkInStatus}
        mentorTimezone={mentorTimezone}
        onCheckIn={onCheckIn}
        onMessage={onMessage}
        showExpandIcon={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
});
