// components/BlockUserIcon.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { useBlockUser } from "@/hooks/block/useBlockUser";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

interface BlockUserIconProps {
  userIdToBlock: string;
  size?: number;
  onBlockSuccess?: () => void;
  style?: any;
  variant?: "icon" | "button"; // New prop for different styles
}

export function BlockUserIcon({
  userIdToBlock,
  size = 20,
  onBlockSuccess,
  style,
  variant = "icon",
}: BlockUserIconProps) {
  const { colors } = useTheme();
  const { blockUser, loading } = useBlockUser();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Block User?",
      "You will no longer see anything from this user and they will not be able to interact with you. You can unblock them from Settings → Block List.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            const success = await blockUser(userIdToBlock);
            if (success) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert(
                "User Blocked",
                "You have successfully blocked this user."
              );
              onBlockSuccess?.();
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", "Failed to block user. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="small"
        color={variant === "button" ? colors.white : colors.textSecondary}
        style={[styles.container, style]}
      />
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      activeOpacity={0.6}
    >
      <IconSymbol
        name="hand.raised.slash"
        size={size}
        color={variant === "button" ? colors.white : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});
