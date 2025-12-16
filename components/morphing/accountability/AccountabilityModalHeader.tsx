import { BlockUserIcon } from "@/components/BlockUserIcon";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { getLocalTimeForTimezone } from "./accountabilityUtils";

interface ActionButton {
  icon: string;
  label: string;
  onPress: () => void;
}

interface AccountabilityModalHeaderProps {
  uid: string;
  timezone?: string;
  actionButtons?: ActionButton[];
}

export function AccountabilityModalHeader({
  uid,
  timezone,
  actionButtons = [],
}: AccountabilityModalHeaderProps) {
  const { colors } = useTheme();
  const localTime = getLocalTimeForTimezone(timezone);

  // Generate anonymous username
  const anonymousUsername = `user-${uid.slice(0, 5)}`;

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
        },
      ]}
    >
      {/* The inline header row */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: colors.iconCircleSecondaryBackground },
          ]}
        >
          <ThemedText type="subtitleSemibold" style={{ color: colors.icon }}>
            {anonymousUsername[5]?.toUpperCase()}
          </ThemedText>
        </View>

        <View style={styles.headerUserInfo}>
          <View style={{ flex: 1 }}>
            <View style={styles.usernameRow}>
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.text, marginRight: 8 }}
              >
                {anonymousUsername}
              </ThemedText>
              <UserStreakDisplay userId={uid} size="small" />
              <BlockUserIcon userIdToBlock={uid} />
            </View>
            {localTime && (
              <ThemedText
                type="caption"
                style={{
                  color: colors.textSecondary,
                  marginTop: 4,
                }}
              >
                Local time: {localTime}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      {actionButtons.length > 0 && (
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          {actionButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickButton,
                {
                  backgroundColor: `${colors.buttonBackground}30`,
                  borderWidth: 1,
                  borderColor: colors.buttonBackground,
                },
              ]}
              onPress={button.onPress}
            >
              <IconSymbol
                name={button.icon}
                size={18}
                color={colors.buttonBackground}
              />
              <ThemedText
                type="button"
                style={{ color: colors.buttonBackground }}
              >
                {button.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quickButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
