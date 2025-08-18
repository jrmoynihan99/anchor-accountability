// components/messages/MyReachOutModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { MyReachOutData } from "./MyReachOutCard";
import { MyReachOutCardContent } from "./MyReachOutCardContent";

interface EncouragementData {
  id: string;
  message: string;
  helperUid: string;
  createdAt: Date;
}

interface MyReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  reachOut: MyReachOutData | null;
  now: Date; // <-- NEW: passed in from parent!
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
      entering={FadeInDown.delay(index * 40)}
      layout={LinearTransition.duration(220)}
      style={{ width: "100%" }}
    >
      {children}
    </Animated.View>
  );
}

export function MyReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  reachOut,
  now, // <-- accept as prop
}: MyReachOutModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const [encouragements, setEncouragements] = useState<EncouragementData[]>([]);
  const [loadingEncouragements, setLoadingEncouragements] = useState(false);

  // No timer state here! All time math uses 'now' from props

  // Fetch encouragements when modal opens and reachOut changes
  useEffect(() => {
    if (!isVisible || !reachOut) {
      setEncouragements([]);
      return;
    }

    setLoadingEncouragements(true);

    const encouragementsQuery = query(
      collection(db, "pleas", reachOut.id, "encouragements"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      encouragementsQuery,
      (snapshot) => {
        const encouragementData = snapshot.docs.map((doc) => ({
          id: doc.id,
          message: doc.data().message || "",
          helperUid: doc.data().helperUid || "",
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        setEncouragements(encouragementData);
        setLoadingEncouragements(false);
      },
      (error) => {
        console.error("Error fetching encouragements:", error);
        setLoadingEncouragements(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isVisible, reachOut]);

  // Early return after all hooks (perfect!)
  if (!reachOut) return null;

  // Format time ago using 'now' from props
  const timeAgo = getTimeAgo(reachOut.createdAt, now);

  // Button content (shows the reach out card in collapsed state)
  const buttonContent = <MyReachOutCardContent reachOut={reachOut} now={now} />;

  // Modal content
  const modalContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Reach Out Header - Simplified */}
      <View style={styles.reachOutHeader}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: colors.iconCircleBackground },
            ]}
          >
            <IconSymbol name="paperplane" size={24} color={colors.icon} />
          </View>
          <View style={styles.userDetails}>
            <ThemedText
              type="subtitleSemibold"
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
            </View>
          </View>
        </View>
      </View>

      {/* Context Section */}
      <View style={styles.contextSection}>
        {reachOut.message && reachOut.message.trim() ? (
          <>
            <ThemedText
              type="subtitleMedium"
              style={[styles.contextLabel, { color: colors.text }]}
            >
              Your Message
            </ThemedText>
            <View
              style={[
                styles.contextMessageContainer,
                {
                  backgroundColor: colors.cardBackground,
                  borderLeftColor: colors.tint,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={[styles.contextMessage, { color: colors.text }]}
              >
                "{reachOut.message}"
              </ThemedText>
            </View>
          </>
        ) : (
          <ThemedText
            type="body"
            style={[styles.generalContext, { color: colors.textSecondary }]}
          >
            You reached out for support and encouragement.
          </ThemedText>
        )}
      </View>

      {/* Encouragements Section - Now with inline count */}
      <View style={styles.encouragementsSection}>
        <View style={styles.sectionHeader}>
          <ThemedText
            type="subtitleSemibold"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Encouragements Received
          </ThemedText>
          <View style={styles.encouragementStats}>
            <IconSymbol
              name="message.fill"
              size={18}
              color={colors.textSecondary}
            />
            <ThemedText
              type="statValue"
              style={[styles.statNumber, { color: colors.textSecondary }]}
            >
              {reachOut.encouragementCount}
            </ThemedText>
          </View>
        </View>

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
                            backgroundColor:
                              colors.iconCircleSecondaryBackground,
                          },
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={[styles.avatarText, { color: colors.icon }]}
                        >
                          {anonymousUsername[5].toUpperCase()}
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
                      style={[styles.encouragementText, { color: colors.text }]}
                    >
                      "{encouragement.message}"
                    </ThemedText>
                  </View>
                </AnimatedEncouragementItem>
              );
            })}
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
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.background}
      buttonContentPadding={16}
      buttonBorderWidth={1}
      buttonBorderColor="transparent"
      buttonBorderRadius={16}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.15]}
    >
      {modalContent}
    </BaseModal>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 42,
    paddingBottom: 32,
  },
  reachOutHeader: {
    marginBottom: 24,
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
  // Context Section
  contextSection: {
    marginBottom: 32,
  },
  contextLabel: {
    marginBottom: 12,
    opacity: 0.9,
  },
  contextMessageContainer: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  contextMessage: {
    lineHeight: 22,
    opacity: 0.9,
  },
  generalContext: {
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.7,
    lineHeight: 22,
  },
  encouragementsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    // marginBottom removed since it's now in sectionHeader
  },
  encouragementStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statNumber: {
    // Typography handled by ThemedText type
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
