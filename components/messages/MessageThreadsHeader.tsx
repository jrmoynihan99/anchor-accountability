// components/messages/MessageThreadsHeader.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, View } from "react-native";

interface MessageThreadsHeaderProps {
  colors: any;
  threadsCount: number;
  loading?: boolean;
  error?: string | null;
}

export function MessageThreadsHeader({
  colors,
  threadsCount,
  loading = false,
  error = null,
}: MessageThreadsHeaderProps) {
  const getSubtitleText = () => {
    if (loading) return "Loading conversations...";
    if (error) return "Error loading conversations";
    if (threadsCount > 0) {
      return `${threadsCount} ongoing conversation${
        threadsCount === 1 ? "" : "s"
      }`;
    }
    return "No conversations yet";
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol name="message" size={20} color={colors.icon} />
        </View>
        <View style={styles.headerText}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Message Threads
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {getSubtitleText()}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    lineHeight: 22,
  },
  headerSubtitle: {
    marginTop: 1,
    opacity: 0.8,
  },
});
