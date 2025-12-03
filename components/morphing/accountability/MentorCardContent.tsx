import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
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

  // Calculate time since last check-in
  const getCheckInStatus = () => {
    if (!lastCheckIn)
      return { text: "Not checked in yet", color: colors.textSecondary };

    const now = new Date();
    const checkInDate = new Date(lastCheckIn);
    const diffHours = Math.floor(
      (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 24)
      return { text: "✅ Checked in today", color: colors.success };
    if (diffHours < 48)
      return {
        text: "⚠️ Last check-in yesterday",
        color: colors.textSecondary,
      };
    return { text: "❌ Overdue check-in", color: colors.error };
  };

  const checkInStatus = getCheckInStatus();

  const handleCheckIn = () => {
    // TODO: Implement check-in logic
    console.log("Check in with mentor");
    onCheckIn?.();
  };

  const handleSOS = () => {
    // TODO: Send SOS notification to mentor
    console.log("Send SOS to mentor");
    onSOS?.();
  };

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
            </View>
            <View style={styles.subtitleRow}>
              <ThemedText
                type="caption"
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Your Mentor
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Check-in status */}
      <View style={styles.footer}>
        <View style={styles.actionHint}>
          <ThemedText
            type="caption"
            style={[styles.hintText, { color: checkInStatus.color }]}
          >
            {checkInStatus.text}
          </ThemedText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
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
          <ThemedText
            type="button"
            style={[styles.buttonText, { color: colors.white }]}
          >
            Check In Today
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={handleSOS}
          activeOpacity={0.85}
        >
          <IconSymbol
            name="exclamationmark.circle.fill"
            color={colors.white}
            size={18}
            style={{ marginRight: 6 }}
          />
          <ThemedText
            type="button"
            style={[styles.buttonText, { color: colors.white }]}
          >
            I'm Struggling
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
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  subtitle: {
    opacity: 0.8,
  },
  stats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    opacity: 0.8,
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
  buttonText: {
    fontSize: 14,
  },
});
