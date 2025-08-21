// components/messages/ThreadItem.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { ThreadWithMessages } from "@/hooks/useThreads";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ThreadItemProps {
  thread: ThreadWithMessages;
  colors: any;
  now: Date;
}

export function ThreadItem({ thread, colors, now }: ThreadItemProps) {
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";

    // Convert Firestore timestamp to Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    // Check if it's today
    const isToday = now.toDateString() === date.toDateString();

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    if (isToday) {
      if (diffInMinutes < 1) return "now";
      if (diffInMinutes < 60) return `${diffInMinutes}m`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours}h`;
    }

    if (isYesterday) {
      return "yesterday";
    }

    // For older dates, show "Aug 6" format
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

    return `${month} ${day}`;
  };

  const openThread = () => {
    router.push({
      pathname: "/message-thread",
      params: {
        threadId: thread.id,
        threadName: thread.otherUserName,
        otherUserId: thread.otherUserId,
        isNewThread: "false",
      },
    });
  };

  return (
    <TouchableOpacity
      style={[styles.threadItem, { backgroundColor: colors.cardBackground }]}
      onPress={openThread}
      activeOpacity={0.8}
    >
      <View style={styles.threadContent}>
        <View
          style={[
            styles.threadAvatar,
            { backgroundColor: colors.iconCircleSecondaryBackground },
          ]}
        >
          <ThemedText type="caption" style={{ color: colors.icon }}>
            {thread.otherUserName[0]?.toUpperCase() || "U"}
          </ThemedText>
        </View>

        <View style={styles.threadInfo}>
          <View style={styles.threadHeader}>
            <View style={styles.threadNameRow}>
              <ThemedText
                type="bodyMedium"
                style={[styles.threadName, { color: colors.text }]}
              >
                {thread.otherUserName}
              </ThemedText>
              <UserStreakDisplay userId={thread.otherUserId} size="small" />
            </View>

            <View style={styles.timeAndChevron}>
              <ThemedText
                type="caption"
                style={[styles.threadTime, { color: colors.textSecondary }]}
              >
                {thread.lastMessage
                  ? formatMessageTime(thread.lastMessage.timestamp)
                  : ""}
              </ThemedText>
              <IconSymbol
                name="chevron.right"
                size={12}
                color={colors.textSecondary}
                style={styles.chevron}
              />
            </View>
          </View>

          <View style={styles.lastMessageContainer}>
            <ThemedText
              type="caption"
              style={[
                styles.lastMessage,
                {
                  color:
                    thread.unreadCount > 0 ? colors.text : colors.textSecondary,
                },
                thread.unreadCount > 0 && { fontWeight: "600" },
              ]}
              numberOfLines={1}
            >
              {thread.lastMessage
                ? `${
                    thread.lastMessage.senderUid === thread.otherUserId
                      ? ""
                      : "You: "
                  }${thread.lastMessage.text}`
                : "No messages yet"}
            </ThemedText>

            {thread.unreadCount > 0 && (
              <View
                style={[styles.unreadBadge, { backgroundColor: colors.tint }]}
              >
                <ThemedText
                  type="caption"
                  style={[styles.unreadCount, { color: colors.white }]}
                >
                  {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  threadItem: {
    borderRadius: 12,
    padding: 16,
  },
  threadContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  threadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  threadInfo: {
    flex: 1,
    minWidth: 0, // Important for text truncation
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  threadNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  threadName: {
    // Removed flex: 1 and marginRight since it's now in threadNameRow
  },
  timeAndChevron: {
    flexDirection: "row",
    alignItems: "center",
  },
  threadTime: {
    fontSize: 12,
    marginRight: 4,
  },
  chevron: {
    // No additional styles needed
  },
  lastMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    flex: 1,
    marginRight: 8,
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: "600",
  },
});
