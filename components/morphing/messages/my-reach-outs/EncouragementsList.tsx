// components/messages/EncouragementsList.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";

interface EncouragementData {
  id: string;
  message: string;
  helperUid: string;
  createdAt: Date;
  openToChat?: boolean; // Changed from OpenToChat to openToChat
}

interface EncouragmentsListProps {
  encouragements: EncouragementData[];
  encouragementCount: number;
  now: Date;
  colors: any;
}

// --- Animation wrapper for encouragement entry ---
function AnimatedEncouragementItem({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown} // Removed .delay(index * 40)
      layout={LinearTransition.duration(220)}
      style={{ width: "100%" }}
    >
      {children}
    </Animated.View>
  );
}

export function EncouragementsList({
  encouragements,
  encouragementCount,
  now,
  colors,
}: EncouragmentsListProps) {
  return (
    <View style={styles.encouragementsSection}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
          Recieved Support
        </ThemedText>
        <View style={styles.encouragementStats}>
          <IconSymbol
            name="message.fill"
            size={18}
            color={colors.textSecondary}
          />
          <ThemedText type="statValue" style={{ color: colors.textSecondary }}>
            {encouragementCount}
          </ThemedText>
        </View>
      </View>

      {encouragementCount === 0 ? (
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
            When people respond to your request, their messages will appear here
          </ThemedText>
        </View>
      ) : (
        <View style={styles.encouragementsList}>
          {encouragements.map((encouragement, index) => {
            // Generate anonymous username from helperUid
            const anonymousUsername = `user-${encouragement.helperUid.substring(
              0,
              5
            )}`;
            const encouragementTimeAgo = getTimeAgo(
              encouragement.createdAt,
              now
            );

            return (
              <AnimatedEncouragementItem key={encouragement.id} index={index}>
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
                        {
                          backgroundColor: colors.iconCircleSecondaryBackground,
                        },
                      ]}
                    >
                      <ThemedText type="caption" style={{ color: colors.icon }}>
                        {anonymousUsername[5].toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.encouragementMeta}>
                      <ThemedText
                        type="bodyMedium"
                        style={{ color: colors.text }}
                      >
                        {anonymousUsername}
                      </ThemedText>
                      <ThemedText
                        type="caption"
                        style={[
                          styles.encouragementTime,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {encouragementTimeAgo}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    type="body"
                    style={{ color: colors.text, fontStyle: "italic" }}
                  >
                    "{encouragement.message}"
                  </ThemedText>

                  {/* Chat invitation section */}
                  {encouragement.openToChat && (
                    <TouchableOpacity
                      style={styles.chatInvitation}
                      onPress={() => {
                        // TODO: Handle chat start
                        console.log("Start chat with", anonymousUsername);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.chatInvitationContent}>
                        <ThemedText
                          type="small"
                          style={{ color: colors.textSecondary }}
                        >
                          user is open to chat
                        </ThemedText>
                        <View
                          style={[
                            styles.chatButton,
                            { backgroundColor: colors.tint },
                          ]}
                        >
                          <IconSymbol
                            name="square.and.pencil"
                            size={20}
                            color={colors.white}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </AnimatedEncouragementItem>
            );
          })}
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

  return `${month} ${day}, ${timeString}`;
}

const styles = StyleSheet.create({
  // Layout and structural styles only - NO text styling
  encouragementsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  encouragementStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noEncouragements: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtext: {
    textAlign: "center",
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
  encouragementMeta: {
    flex: 1,
  },
  encouragementTime: {
    marginTop: 1,
  },

  // Chat invitation styles
  chatInvitation: {
    position: "relative",
    marginBottom: -8,
    marginRight: -8,
  },
  chatInvitationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
