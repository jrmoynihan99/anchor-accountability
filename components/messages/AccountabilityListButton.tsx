import { useTheme } from "@/hooks/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { AccountabilityMessagesContent } from "./AccountabilityMessagesContent";

interface AccountabilityListButtonProps {
  // ButtonModalTransitionBridge props
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function AccountabilityListButton({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: AccountabilityListButtonProps) {
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
          <AccountabilityMessagesContent showExpandIcon={true} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Otherwise, render as a regular non-touchable card
  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <AccountabilityMessagesContent showExpandIcon={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
});
