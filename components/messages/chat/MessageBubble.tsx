// components/messages/MessageBubble.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MessageDisplayProps } from "./types";

export function MessageBubble({
  message,
  showTimestamp,
  colors,
}: MessageDisplayProps) {
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);

    // Reset hours for day comparison
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const messageDateStart = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    );

    const daysDiff = Math.floor(
      (todayStart.getTime() - messageDateStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Format time (e.g., "2:30 PM")
    const timeStr = messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (daysDiff === 0) {
      // Today
      return `Today ${timeStr}`;
    } else if (daysDiff === 1) {
      // Yesterday
      return `Yesterday ${timeStr}`;
    } else if (daysDiff >= 2 && daysDiff <= 6) {
      // 2-6 days ago: full day name
      const dayName = messageDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      return `${dayName} ${timeStr}`;
    } else {
      // 7+ days ago: abbreviated day + date + "at" + time
      const dayAbbr = messageDate.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const monthAbbr = messageDate.toLocaleDateString("en-US", {
        month: "short",
      });
      const dayNum = messageDate.getDate();
      return `${dayAbbr}, ${monthAbbr} ${dayNum} at ${timeStr}`;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sending":
        return (
          <IconSymbol name="clock" size={12} color={colors.textSecondary} />
        );
      case "sent":
        return (
          <IconSymbol name="checkmark" size={12} color={colors.textSecondary} />
        );
      case "delivered":
        return (
          <IconSymbol
            name="checkmark.circle"
            size={12}
            color={colors.textSecondary}
          />
        );
      case "read":
        return (
          <IconSymbol
            name="checkmark.circle.fill"
            size={12}
            color={colors.tint}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View>
      {showTimestamp && (
        <View style={styles.timestampContainer}>
          <ThemedText
            type="caption"
            style={[styles.timestamp, { color: colors.textSecondary }]}
          >
            {formatTime(message.timestamp)}
          </ThemedText>
        </View>
      )}

      <View
        style={[
          styles.messageContainer,
          message.isFromUser
            ? styles.userMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            message.isFromUser
              ? [styles.userMessage, { backgroundColor: colors.tint }]
              : [
                  styles.otherMessage,
                  { backgroundColor: colors.cardBackground },
                ],
          ]}
        >
          <ThemedText
            type="body"
            style={[
              styles.messageText,
              {
                color: message.isFromUser ? colors.white : colors.text,
              },
            ]}
          >
            {message.text}
          </ThemedText>
        </View>

        {message.isFromUser && (
          <View style={styles.messageStatus}>
            {getStatusIcon(message.status)}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timestampContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  timestamp: {
    fontSize: 12,
  },
  messageContainer: {
    marginVertical: 2,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
    paddingLeft: 64,
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
    paddingRight: 64,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: "80%",
  },
  userMessage: {
    borderBottomRightRadius: 6,
  },
  otherMessage: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageStatus: {
    marginLeft: 6,
    marginBottom: 4,
  },
});
