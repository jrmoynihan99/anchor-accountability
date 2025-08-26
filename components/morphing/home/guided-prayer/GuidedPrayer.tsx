import { useTheme } from "@/hooks/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { GuidedPrayerContent } from "./GuidedPrayerContent";

// ================== TYPES ==================
interface GuidedPrayerProps {
  // ButtonModalTransitionBridge props
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onBeginPrayer?: () => void;
}

// ================== COMPONENT ==================
export function GuidedPrayer({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
  onBeginPrayer,
}: GuidedPrayerProps) {
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
          <GuidedPrayerContent
            showButtons={true}
            onBeginPrayer={onBeginPrayer}
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
      <GuidedPrayerContent showButtons={true} onBeginPrayer={onBeginPrayer} />
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
