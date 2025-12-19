import { ThemedText } from "@/components/ThemedText";
import { IconSymbol, type IconSymbolName } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";

interface AnonymousBadgeProps {
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  text?: string;
  icon?: IconSymbolName; // Now type-safe!
  iconColor?: string;
  textColor?: string;
}

export function AnonymousBadge({
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
  text = "100% Anonymous",
  icon,
  iconColor,
  textColor,
}: AnonymousBadgeProps) {
  const { colors } = useTheme();

  // Default logic for icon and colors
  const isTouchable = !!onPress && !!buttonRef;
  const defaultIcon: IconSymbolName = isTouchable
    ? "questionmark.circle"
    : "eye.slash";
  const finalIcon: IconSymbolName = icon || defaultIcon;
  const finalIconColor =
    iconColor ?? (isTouchable ? colors.textSecondary : colors.text);
  const finalTextColor = textColor ?? colors.text;

  // Touchable badge (with modal bridge)
  if (isTouchable) {
    return (
      <Animated.View style={style}>
        <TouchableOpacity
          ref={buttonRef}
          style={[
            styles.anonymousBadge,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.8}
        >
          <IconSymbol
            name={finalIcon}
            size={14}
            color={finalIconColor}
            style={{ marginRight: 6 }}
          />
          <ThemedText
            type="badge"
            style={[styles.anonymousBadgeText, { color: finalTextColor }]}
          >
            {text}
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Static badge
  return (
    <View
      style={[
        styles.anonymousBadge,
        {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
        },
        style,
      ]}
    >
      <IconSymbol
        name={finalIcon}
        size={14}
        color={finalIconColor}
        style={{ marginRight: 6 }}
      />
      <ThemedText
        type="badge"
        style={[styles.anonymousBadgeText, { color: finalTextColor }]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  anonymousBadge: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  anonymousBadgeText: {
    // Typography handled by ThemedText type="badge"
  },
});
