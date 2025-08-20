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
    return timestamp
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
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
