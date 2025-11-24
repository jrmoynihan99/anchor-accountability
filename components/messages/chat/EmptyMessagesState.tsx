// components/messages/EmptyMessagesState.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, View } from "react-native";
import { EmptyStateProps } from "./types";

export function EmptyMessagesState({
  isNewThread,
  threadName,
  colors,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyStateWrapper}>
      <View style={styles.emptyState}>
        <IconSymbol
          name="message"
          size={48}
          color={colors.textSecondary}
          style={styles.emptyIcon}
        />
        <ThemedText
          type="bodyMedium"
          style={[styles.emptyTitle, { color: colors.text }]}
        >
          {isNewThread ? "Start your conversation" : "No messages yet"}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.emptySubtitle, { color: colors.textSecondary }]}
        >
          {isNewThread
            ? `Send a message to begin chatting with ${
                threadName || "this person"
              }`
            : "Messages will appear here when sent"}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyStateWrapper: {
    flex: 1,
    transform: [{ scaleY: -1 }], // Counter-invert to fix upside-down rendering
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.8,
  },
});
