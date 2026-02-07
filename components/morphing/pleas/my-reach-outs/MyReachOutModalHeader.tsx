// components/messages/MyReachOutModalHeader.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MyReachOutData } from "./MyReachOutCard";

interface MyReachOutModalHeaderProps {
  reachOut: MyReachOutData;
  now: Date;
  colors: any;
}

export function MyReachOutModalHeader({
  reachOut,
  now,
  colors,
}: MyReachOutModalHeaderProps) {
  // Format time ago using 'now' from props
  const timeAgo = getTimeAgo(reachOut.createdAt, now);

  return (
    <View
      style={[
        styles.headerCard,
        {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.reachOutHeader}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: `${colors.iconCircleBackground}50` },
            ]}
          >
            <IconSymbol name="paperplane" size={24} color={colors.icon} />
          </View>
          <View style={styles.userDetails}>
            <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
              Your Request
            </ThemedText>
            <View style={styles.metaInfo}>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary }}
              >
                {timeAgo}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View
          style={[
            styles.statsSection,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
        >
          <View style={styles.statContent}>
            <View
              style={[
                styles.statIconCircle,
                { backgroundColor: `${colors.textSecondary}33` },
              ]}
            >
              <IconSymbol
                name="message.fill"
                size={16}
                color={colors.textSecondary}
              />
            </View>
            <ThemedText
              type="statValue"
              style={{ color: colors.textSecondary }}
            >
              {reachOut.encouragementCount}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Context Section - Now inside the same card */}
      <View style={styles.contextDivider} />
      {reachOut.message && reachOut.message.trim() ? (
        <View
          style={[
            styles.contextMessageContainer,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
        >
          <ThemedText
            type="body"
            style={{ color: colors.text, fontStyle: "italic" }}
          >
            "{reachOut.message}"
          </ThemedText>
        </View>
      ) : (
        <View style={styles.contextHeader}>
          <View
            style={[
              styles.contextIconCircle,
              { backgroundColor: `${colors.iconCircleBackground}50` },
            ]}
          >
            <IconSymbol name="heart" size={16} color={colors.icon} />
          </View>
          <ThemedText type="subtitleMedium" style={{ color: colors.text }}>
            Support Request
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// Helper function
function getTimeAgo(date: Date, now: Date): string {
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
  // Layout and structural styles only - NO text styling
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    //elevation: 1,
  },
  reachOutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statsSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contextDivider: {
    height: 1,
    marginVertical: 8,
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contextIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contextMessageContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginTop: 0,
  },
});
