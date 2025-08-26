// components/messages/PleaCardContent.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { PleaData } from "./PleaCard";

interface PleaCardContentProps {
  plea: PleaData;
  now: Date; // <-- NEW
}

export function PleaCardContent({ plea, now }: PleaCardContentProps) {
  const { colors } = useTheme();

  // Generate anonymous username from UID
  const anonymousUsername = `user-${plea.uid.substring(0, 5)}`;

  // Use now passed from parent for all time math
  const timeAgo = getTimeAgo(plea.createdAt, now);
  const isUrgent =
    plea.encouragementCount === 0 && getHoursAgo(plea.createdAt, now) > 2;

  const hasResponded = plea.hasUserResponded || false;

  const getMessageColor = () => {
    if (isUrgent) return colors.error;
    if (hasResponded) return colors.success;
    return colors.textSecondary;
  };

  return (
    <>
      {isUrgent && (
        <View style={[styles.urgentBadge, { backgroundColor: colors.error }]}>
          <IconSymbol name="exclamationmark" size={12} color={colors.white} />
        </View>
      )}

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
              {anonymousUsername[5].toUpperCase()}
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
              <UserStreakDisplay userId={plea.uid} size="small" />
            </View>
            <ThemedText
              type="caption"
              style={[
                styles.timestamp,
                { color: isUrgent ? colors.error : colors.textSecondary },
              ]}
            >
              {timeAgo}
            </ThemedText>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <IconSymbol
              name="message.fill"
              size={16}
              color={getMessageColor()}
            />
            <ThemedText
              type="captionMedium"
              style={{
                color: getMessageColor(),
                fontWeight: "600",
              }}
            >
              {plea.encouragementCount}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Only show message container if there's a message */}
      {plea.message && plea.message.trim() && (
        <View style={styles.messageContainer}>
          <ThemedText
            type="body"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.message, { color: colors.text }]}
          >
            "{plea.message}"
          </ThemedText>
        </View>
      )}

      <View
        style={[styles.footer, !plea.message?.trim() && styles.footerNoMessage]}
      >
        <View style={styles.actionHint}>
          <ThemedText
            type="caption"
            style={[styles.hintText, { color: colors.textSecondary }]}
          >
            {hasResponded
              ? "You've sent encouragement"
              : "Tap to send encouragement"}
          </ThemedText>
          <IconSymbol
            name={hasResponded ? "checkmark" : "arrow.right"}
            size={12}
            color={hasResponded ? colors.success : colors.textSecondary}
          />
        </View>
      </View>
    </>
  );
}

// Helper functions (now always expect the "now" argument)
function getTimeAgo(date: Date, now: Date): string {
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
}

function getHoursAgo(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

const styles = StyleSheet.create({
  urgentBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
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
  timestamp: {
    marginTop: 1,
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
  messageContainer: {
    marginBottom: 10,
  },
  message: {
    lineHeight: 18,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  footerNoMessage: {
    marginTop: -2,
  },
  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    opacity: 0.6,
  },
});
