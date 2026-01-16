import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { StreakCardContent } from "./StreakCardContent";
import { type StreakEntry } from "./streakUtils";

interface StreakCardProps {
  streakData: StreakEntry[];
  onCheckIn: (status: "success" | "fail") => void;
  onUndo: (date: string) => void;
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  // NEW: Props to sync undo state
  showUndo?: boolean;
  lastModifiedDate?: string | null;
  onUndoStateChange?: (showUndo: boolean, date: string | null) => void;
}

export function StreakCard({
  streakData,
  onCheckIn,
  onUndo,
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
  showUndo,
  lastModifiedDate,
  onUndoStateChange,
}: StreakCardProps) {
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
          <StreakCardContent
            streakData={streakData}
            onCheckIn={onCheckIn}
            onUndo={onUndo}
            showButtons={true}
            showUndo={showUndo}
            lastModifiedDate={lastModifiedDate}
            onUndoStateChange={onUndoStateChange}
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
      <StreakCardContent
        streakData={streakData}
        onCheckIn={onCheckIn}
        onUndo={onUndo}
        showButtons={true}
        showUndo={showUndo}
        lastModifiedDate={lastModifiedDate}
        onUndoStateChange={onUndoStateChange}
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
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
});
