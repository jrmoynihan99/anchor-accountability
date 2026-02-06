// components/messages/MyReachOutCardContent.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MyReachOutData } from "./MyReachOutCard";

interface MyReachOutCardContentProps {
  reachOut: MyReachOutData;
  now: Date;
}

export function MyReachOutCardContent({
  reachOut,
  now,
}: MyReachOutCardContentProps) {
  const { colors } = useTheme();
  const timeAgo = getTimeAgo(reachOut.createdAt, now);
  const lastEncouragementAgo = reachOut.lastEncouragementAt
    ? getTimeAgo(reachOut.lastEncouragementAt, now)
    : null;

  return (
    <>
      <View style={styles.cardHeader}>
        <View style={styles.leftInfo}>
          <View style={styles.statusInfo}>
            <ThemedText
              type="bodyMedium"
              style={[styles.timeText, { color: colors.text }]}
            >
              {timeAgo}
            </ThemedText>
            {lastEncouragementAgo && (
              <ThemedText
                type="caption"
                style={[
                  styles.lastEncouragement,
                  { color: colors.textSecondary },
                ]}
              >
                Last reply: {lastEncouragementAgo}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.stats}>
          {reachOut.unreadCount > 0 && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.tint }]}
            >
              <ThemedText
                type="caption"
                style={[styles.unreadCount, { color: colors.white }]}
              >
                {reachOut.unreadCount > 99 ? "99+" : reachOut.unreadCount}
              </ThemedText>
            </View>
          )}
          <View style={styles.statItem}>
            <IconSymbol
              name="message.fill"
              size={16}
              color={colors.textSecondary}
            />
            <ThemedText
              type="captionMedium"
              style={{
                color: colors.textSecondary,
              }}
            >
              {reachOut.encouragementCount}
            </ThemedText>
          </View>
        </View>
      </View>

      {reachOut.message && reachOut.message.trim() && (
        <View style={styles.messageContainer}>
          <ThemedText
            type="body"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.message, { color: colors.text }]}
          >
            "{reachOut.message}"
          </ThemedText>
        </View>
      )}

      <View
        style={[
          styles.footer,
          !reachOut.message?.trim() && styles.footerNoMessage,
        ]}
      >
        <View style={styles.actionHint}>
          <ThemedText
            type="caption"
            style={[styles.hintText, { color: colors.textSecondary }]}
          >
            {reachOut.encouragementCount === 0
              ? "Waiting for encouragement"
              : reachOut.encouragementCount === 1
                ? "View 1 encouragement"
                : `View ${reachOut.encouragementCount} encouragements`}
          </ThemedText>
          <IconSymbol
            name={reachOut.encouragementCount === 0 ? "clock" : "arrow.right"}
            size={12}
            color={colors.textSecondary}
          />
        </View>
      </View>
    </>
  );
}

// Helper function
function getTimeAgo(date: Date, now: Date): string {
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );

  // Check if it's today
  const isToday = now.toDateString() === date.toDateString();

  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  if (isToday) {
    if (diffInMinutes < 1) return "Today - Just now";
    if (diffInMinutes < 60) return `Today - ${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    return `Today - ${diffInHours}h ago`;
  }

  if (isYesterday) {
    const timeString = date
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `Yesterday - ${timeString}`;
  }

  // For older dates, show "Aug 6, 2pm" format
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const timeString = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    })
    .toLowerCase();

  return `${month} ${day} - ${timeString}`;
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  leftInfo: {
    flex: 1,
  },
  statusInfo: {
    flex: 1,
  },
  timeText: {
    lineHeight: 20,
  },
  lastEncouragement: {
    marginTop: 2,
    opacity: 0.8,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 0,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: "600",
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
