import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CheckInStatus, getLocalTimeForTimezone } from "./accountabilityUtils";

interface MenteeCardContentProps {
  menteeUid: string;
  recoveryStreak: number;
  checkInStreak: number;
  checkInStatus: CheckInStatus;
  menteeTimezone?: string;
  showExpandIcon?: boolean;
  onMessage?: () => void;
}

export function MenteeCardContent({
  menteeUid,
  checkInStatus,
  menteeTimezone,
  showExpandIcon = true,
  onMessage,
}: MenteeCardContentProps) {
  const { colors } = useTheme();
  const localTime = getLocalTimeForTimezone(menteeTimezone);

  const ExpandIcon = () => {
    if (!showExpandIcon) return null;
    return (
      <IconSymbol
        name="arrow.up.left.and.arrow.down.right"
        size={18}
        color={colors.textSecondary}
        style={styles.expandIcon}
      />
    );
  };

  // Generate anonymous username
  const anonymousUsername = `user-${menteeUid.slice(0, 5)}`;

  // Get the actual color from the theme
  const statusColor = colors[checkInStatus.colorKey];

  return (
    <View style={{ position: "relative" }}>
      <ExpandIcon />

      {/* Header - matching PleaCardContent */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: colors.iconCircleSecondaryBackground },
            ]}
          >
            <ThemedText
              type="caption"
              style={[styles.avatarText, { color: colors.icon }]}
            >
              {anonymousUsername[5]?.toUpperCase() || "U"}
            </ThemedText>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <ThemedText
                type="bodyMedium"
                style={[styles.username, { color: colors.text }]}
              >
                {anonymousUsername}
              </ThemedText>
              <UserStreakDisplay userId={menteeUid} size="small" />
            </View>
            {localTime && (
              <ThemedText
                type="caption"
                style={{
                  color: colors.textSecondary,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                Local time: {localTime}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {/* ----- CHECK-IN STATUS (icon + text) ----- */}
      <View style={styles.footer}>
        <View style={styles.actionHint}>
          <IconSymbol
            name={checkInStatus.icon}
            size={14}
            color={statusColor}
            style={{ marginRight: 6 }}
          />
          <ThemedText
            type="caption"
            style={[styles.hintText, { color: statusColor }]}
          >
            {checkInStatus.isOverdue && checkInStatus.overdueText
              ? `${checkInStatus.text} (${checkInStatus.overdueText})`
              : checkInStatus.text}
          </ThemedText>
        </View>
      </View>

      {/* Quick Actions */}
      {onMessage && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: `${colors.buttonBackground}30`,
                borderWidth: 1,
                borderColor: colors.buttonBackground,
              },
            ]}
            onPress={onMessage}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="message.fill"
              color={colors.buttonBackground}
              size={18}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              type="button"
              style={{ color: colors.buttonBackground }}
            >
              Message
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    opacity: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: "center",
  },
});
