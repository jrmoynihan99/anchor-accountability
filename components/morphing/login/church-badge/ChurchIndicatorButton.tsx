// components/onboarding/login/church-indicator/ChurchIndicatorButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";

interface ChurchIndicatorButtonProps {
  organizationId: string;
  organizationName: string;
  buttonRef: any; // Accept any ref type from ButtonModalTransitionBridge
  style?: any;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function ChurchIndicatorButton({
  organizationId,
  organizationName,
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: ChurchIndicatorButtonProps) {
  const { colors } = useTheme();
  const isGuest = organizationId === "public";

  return (
    <Animated.View style={[styles.wrapper, style]}>
      <TouchableOpacity
        ref={buttonRef}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.container,
          {
            backgroundColor: isGuest
              ? colors.cardBackground
              : colors.iconCircleSecondaryBackground,
            borderColor: isGuest ? colors.border : colors.icon + "33",
          },
        ]}
      >
        <IconSymbol
          name={isGuest ? "building.2" : "building.2"}
          size={16}
          color={isGuest ? colors.textSecondary : colors.icon}
        />
        <View style={styles.textRow}>
          {isGuest ? (
            <ThemedText
              type="bodyMedium"
              style={{ color: colors.textSecondary }}
            >
              Join through your Church
            </ThemedText>
          ) : (
            <>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary }}
              >
                Joining{" "}
              </ThemedText>
              <ThemedText
                type="bodyMedium"
                style={[styles.organizationName, { color: colors.text }]}
              >
                {organizationName}
              </ThemedText>
            </>
          )}
        </View>
        <IconSymbol
          name="chevron.forward"
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  organizationName: {
    fontWeight: "600",
  },
});
