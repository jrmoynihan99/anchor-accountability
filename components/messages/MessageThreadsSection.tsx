import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useThreads } from "@/hooks/useThreads";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SectionHeader } from "./MessageThreadsHeader";
import { ThreadItem } from "./ThreadItem";

interface MessageThreadsSectionProps {
  scrollY: any; // SharedValue<number> but keeping it simple
  onScroll: (event: any) => void;
}

export function MessageThreadsSection({
  scrollY,
  onScroll,
}: MessageThreadsSectionProps) {
  const { colors } = useTheme();
  const { threads, loading, error } = useThreads();

  // Timer for updating relative timestamps
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.section}>
        <SectionHeader scrollY={scrollY} threadsCount={0} loading={true} />
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="clock"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            Loading your conversations...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <SectionHeader scrollY={scrollY} threadsCount={0} error={error} />
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            {error}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader scrollY={scrollY} threadsCount={threads.length} />

      {threads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="message"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            No message threads yet
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.emptySubtext, { color: colors.textSecondary }]}
          >
            When you start a chat with someone, or someone starts a chat with
            you, it will appear here
          </ThemedText>
        </View>
      ) : (
        <View style={styles.threadsList}>
          {threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              colors={colors}
              now={now}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.8,
  },
  emptySubtext: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 18,
  },
  threadsList: {
    gap: 8,
  },
});
