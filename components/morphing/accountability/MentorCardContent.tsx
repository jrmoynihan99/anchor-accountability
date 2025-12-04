import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface MentorCardContentProps {
  mentorUid: string;
  streak: number;
  lastCheckIn: string | null;
  showExpandIcon?: boolean;
  onCheckIn?: () => void;
  onSOS?: () => void;
}

export function MentorCardContent({
  mentorUid,
  streak,
  lastCheckIn,
  showExpandIcon = true,
  onCheckIn,
  onSOS,
}: MentorCardContentProps) {
  const { colors } = useTheme();

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

  // Helper to format time ago
  const formatTimeAgo = (diffHours: number) => {
    const days = Math.floor(diffHours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months}mo ago`;
    if (weeks > 0) return `${weeks}wk ago`;
    return `${days}d ago`;
  };

  // ---- CHECK-IN STATUS LOGIC (NEW WITH ICONS) ----
  const getCheckInStatus = () => {
    if (!lastCheckIn) {
      return {
        text: "Not checked in yet",
        icon: "clock.fill",
        color: colors.textSecondary,
      };
    }

    const now = new Date();
    const checkInDate = new Date(lastCheckIn);
    const diffHours = Math.floor(
      (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 24) {
      return {
        text: "Checked in today",
        icon: "checkmark.circle.fill",
        color: colors.success,
      };
    }

    if (diffHours < 48) {
      return {
        text: "Last check-in yesterday",
        icon: "exclamationmark.triangle.fill",
        color: colors.textSecondary,
      };
    }

    return {
      text: `Overdue check-in (${formatTimeAgo(diffHours)})`,
      icon: "xmark.circle.fill",
      color: colors.error,
    };
  };

  const checkInStatus = getCheckInStatus();
  const hasCheckedInToday = checkInStatus.text === "Checked in today";

  const handleCheckIn = () => onCheckIn?.();
  const handleSOS = () => onSOS?.();

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
          </View>
        </View>
      </View>

      {/* ----- CHECK-IN STATUS (icon + text) ----- */}
      <View style={styles.footer}>
        <View style={styles.actionHint}>
          <IconSymbol
            name={checkInStatus.icon}
            size={14}
            color={checkInStatus.color}
            style={{ marginRight: 6 }}
          />
          <ThemedText
            type="caption"
            style={[styles.hintText, { color: checkInStatus.color }]}
          >
            {checkInStatus.text}
          </ThemedText>
        </View>
      </View>

      {/* ----- ACTION BUTTONS ----- */}
      <View style={styles.buttonRow}>
        {/* CHECK IN BUTTON (active or disabled) */}
        {hasCheckedInToday ? (
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
  subtitle: {
    marginTop: 1,
    opacity: 0.8,
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
