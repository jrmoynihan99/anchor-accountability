// components/messages/MyReachOutModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { MyReachOutData } from "./MyReachOutCard";
import { MyReachOutCardContent } from "./MyReachOutCardContent";

interface MyReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  reachOut: MyReachOutData | null;
}

export function MyReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  reachOut,
}: MyReachOutModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  if (!reachOut) return null;

  // Format time ago
  const timeAgo = getTimeAgo(reachOut.createdAt);
  const lastEncouragementAgo = reachOut.lastEncouragementAt
    ? getTimeAgo(reachOut.lastEncouragementAt)
    : null;

  // Button content (shows the reach out card in collapsed state)
  const buttonContent = <MyReachOutCardContent reachOut={reachOut} />;

  // Modal content
  const modalContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Reach Out Header */}
      <View style={styles.reachOutHeader}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: colors.iconCircleBackground },
            ]}
          >
            <IconSymbol
              name="person.crop.circle"
              size={24}
              color={colors.icon}
            />
          </View>
          <View style={styles.userDetails}>
            <ThemedText
              type="title"
              style={[styles.title, { color: colors.text }]}
            >
              Your Request
            </ThemedText>
            <View style={styles.metaInfo}>
              <ThemedText
                type="caption"
                style={[styles.timestamp, { color: colors.textSecondary }]}
              >
                {timeAgo}
              </ThemedText>
              {lastEncouragementAgo && (
                <>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: colors.textSecondary },
                    ]}
                  />
                  <ThemedText
                    type="caption"
                    style={[styles.lastReply, { color: colors.textSecondary }]}
                  >
                    Last reply: {lastEncouragementAgo}
                  </ThemedText>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.encouragementStats}>
          <IconSymbol
            name="message.fill"
            size={18}
            color={
              reachOut.encouragementCount > 0
                ? colors.success
                : colors.textSecondary
            }
          />
          <ThemedText
            type="captionMedium"
            style={[
              styles.statNumber,
              {
                color:
                  reachOut.encouragementCount > 0
                    ? colors.success
                    : colors.textSecondary,
              },
            ]}
          >
            {reachOut.encouragementCount}
          </ThemedText>
        </View>
      </View>

      {/* Reach Out Message */}
      {reachOut.message && reachOut.message.trim() && (
        <View
          style={[
            styles.messageContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ThemedText
            type="body"
            style={[styles.reachOutMessage, { color: colors.text }]}
          >
            "{reachOut.message}"
          </ThemedText>
        </View>
      )}

      {/* Encouragements Section */}
      <View style={styles.encouragementsSection}>
        <ThemedText
          type="title"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Encouragements Received
        </ThemedText>

        {reachOut.encouragementCount === 0 ? (
          <View style={styles.noEncouragements}>
            <IconSymbol
              name="heart"
              size={32}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <ThemedText
              type="captionMedium"
              style={[styles.emptyText, { color: colors.textSecondary }]}
            >
              No encouragements yet
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.emptySubtext, { color: colors.textSecondary }]}
            >
              When people respond to your request, their messages will appear
              here
            </ThemedText>
          </View>
        ) : (
          <View style={styles.encouragementsList}>
            {/* TODO: Map through actual encouragements when available */}
            <View
              style={[
                styles.encouragementItem,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.encouragementHeader}>
                <View
                  style={[
                    styles.encouragementAvatar,
                    { backgroundColor: colors.iconCircleSecondaryBackground },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={[styles.avatarText, { color: colors.icon }]}
                  >
                    A
                  </ThemedText>
                </View>
                <View style={styles.encouragementMeta}>
                  <ThemedText
                    type="bodyMedium"
                    style={[
                      styles.encouragementUsername,
                      { color: colors.text },
                    ]}
                  >
                    Anonymous supporter
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.encouragementTime,
                      { color: colors.textSecondary },
                    ]}
                  >
                    2h ago
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                type="body"
                style={[styles.encouragementText, { color: colors.text }]}
              >
                "You've got this! Remember that difficult times don't last, but
                resilient people do. Take it one step at a time. 💪"
              </ThemedText>
            </View>

            {/* Show placeholder for additional encouragements */}
            {reachOut.encouragementCount > 1 && (
              <View
                style={[
                  styles.moreEncouragements,
                  { backgroundColor: colors.background },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={[styles.moreText, { color: colors.textSecondary }]}
                >
                  +{reachOut.encouragementCount - 1} more{" "}
                  {reachOut.encouragementCount - 1 === 1
                    ? "encouragement"
                    : "encouragements"}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={theme ?? "dark"}
      backgroundColor={colors.cardBackground} // Modal background
      buttonBackgroundColor={colors.background} // MyReachOutCard uses background
      buttonContentPadding={16} // MyReachOutCard uses 16px padding
      buttonBorderWidth={1} // MyReachOutCard has borderWidth: 1
      buttonBorderColor="transparent" // MyReachOutCard uses transparent border
      buttonBorderRadius={16} // MyReachOutCard uses 16px border radius
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.15]}
    >
      {modalContent}
    </BaseModal>
  );
}

// Helper function
function getTimeAgo(date: Date): string {
  const now = new Date();
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

  return `${month} ${day}, ${timeString}`;
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  reachOutHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
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
  title: {
    lineHeight: 22,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  timestamp: {
    opacity: 0.8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  lastReply: {
    opacity: 0.8,
  },
  encouragementStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statNumber: {
    fontWeight: "600",
  },
  messageContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  reachOutMessage: {
    fontStyle: "italic",
    lineHeight: 22,
  },
  encouragementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  noEncouragements: {
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
  encouragementsList: {
    gap: 12,
  },
  encouragementItem: {
    padding: 16,
    borderRadius: 16,
  },
  encouragementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  encouragementAvatar: {
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
  encouragementMeta: {
    flex: 1,
  },
  encouragementUsername: {
    lineHeight: 18,
  },
  encouragementTime: {
    marginTop: 1,
    opacity: 0.8,
  },
  encouragementText: {
    lineHeight: 20,
    fontStyle: "italic",
  },
  moreEncouragements: {
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  moreText: {
    opacity: 0.7,
  },
});
