import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CheckInStatus, getLocalTimeForTimezone } from "../accountabilityUtils";

interface MentorCardContentProps {
  mentorUid: string;
  streak: number;
  checkInStatus: CheckInStatus;
  mentorTimezone?: string;
  showExpandIcon?: boolean;
  onCheckIn?: () => void;
  onSOS?: () => void;
  onMessage?: () => void;
}

export function MentorCardContent({
  mentorUid,
  checkInStatus,
  mentorTimezone,
  showExpandIcon = true,
  onCheckIn,
  onMessage,
}: MentorCardContentProps) {
  const { colors } = useTheme();
  const localTime = getLocalTimeForTimezone(mentorTimezone);

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
  const anonymousUsername = `user-${mentorUid.slice(0, 5)}`;

  // Get the actual color from the theme
  const statusColor = colors[checkInStatus.colorKey];

  const handleCheckIn = () => onCheckIn?.();

  return (
    <View style={{ position: "relative" }}>
      <ExpandIcon />

      {/* ----- HEADER ----- */}
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
              <UserStreakDisplay userId={mentorUid} size="small" />
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

      {/* ----- ACTION BUTTONS ----- */}
      <View style={styles.buttonRow}>
        {/* CHECK IN BUTTON (active or disabled) */}
        {checkInStatus.hasCheckedInToday ? (
          <View
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.bannerBackground,
                borderColor: colors.bannerBorder,
                borderWidth: 1,
              },
            ]}
          >
            <IconSymbol
              name="checkmark.circle"
              color={colors.textSecondary}
              size={18}
              style={{ marginRight: 6, opacity: 0.7 }}
            />
            <ThemedText
              type="button"
              style={{
                color: colors.textSecondary,
                opacity: 0.8,
              }}
            >
              Checked In
            </ThemedText>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.buttonBackground },
            ]}
            onPress={handleCheckIn}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="checkmark.circle.fill"
              color={colors.white}
              size={18}
              style={{ marginRight: 6 }}
            />
            <ThemedText type="button" style={{ color: colors.white }}>
              Check In
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* MESSAGE BUTTON */}
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
          <ThemedText type="button" style={{ color: colors.buttonBackground }}>
            Message
          </ThemedText>
        </TouchableOpacity>
      </View>
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
    opacity: 0.85,
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
