// components/messages/MessageThreadsSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, View } from "react-native";

export function MessageThreadsSection() {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  return (
    <View style={styles.section}>
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
              Ongoing conversations
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.comingSoonContainer}>
        <IconSymbol
          name="clock"
          size={24}
          color={colors.textSecondary}
          style={styles.comingSoonIcon}
        />
        <ThemedText
          type="captionMedium"
          style={[styles.comingSoonText, { color: colors.textSecondary }]}
        >
          Coming Soon
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.comingSoonSubtext, { color: colors.textSecondary }]}
        >
          Private conversations with people who are willing to chat
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  comingSoonContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  comingSoonIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  comingSoonText: {
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.8,
  },
  comingSoonSubtext: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 18,
  },
});
