// components/messages/SupportingYouSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/context/ThemeContext";
import { useThreads } from "@/hooks/useThreads";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { DeclinedInviteItem } from "../DeclinedInviteItem"; // ✅ NEW
import { SentInviteItem } from "../SentInviteItem";

interface InviteWithData {
  inviteId: string;
  userName: string;
  userId: string;
  threadId: string;
}

export function SupportingYouSection({
  scrollY,
}: {
  scrollY: SharedValue<number>;
}) {
  const { colors } = useTheme();
  const { sentInvites, declinedInvites } = useAccountability(); // ✅ Add declinedInvites
  const { threads } = useThreads();
  const [sentInvitesWithData, setSentInvitesWithData] = useState<
    InviteWithData[]
  >([]);
  const [declinedInvitesWithData, setDeclinedInvitesWithData] = useState<
    InviteWithData[]
  >([]); // ✅ NEW

  // ✅ Fetch sent invites data
  useEffect(() => {
    const fetchInviteData = async () => {
      const inviteDataPromises = sentInvites.map(async (invite) => {
        // The person we sent the invite to (they would be our mentor)
        const otherUserId = invite.mentorUid;

        // Find the thread with this user
        const thread = threads.find((t) => t.otherUserId === otherUserId);

        if (!thread) return null;

        // Fetch the user's display name
        try {
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userName = userDoc.exists()
            ? userDoc.data()?.displayName ||
              `user-${otherUserId.substring(0, 5)}`
            : `user-${otherUserId.substring(0, 5)}`;

          return {
            inviteId: invite.id,
            userName,
            userId: otherUserId,
            threadId: thread.id,
          };
        } catch (error) {
          console.error("Error fetching user data:", error);
          return null;
        }
      });

      const results = await Promise.all(inviteDataPromises);
      setSentInvitesWithData(
        results.filter((item): item is InviteWithData => item !== null)
      );
    };

    if (sentInvites.length > 0) {
      fetchInviteData();
    } else {
      setSentInvitesWithData([]);
    }
  }, [sentInvites, threads]);

  // ✅ NEW: Fetch declined invites data
  useEffect(() => {
    const fetchDeclinedInviteData = async () => {
      const inviteDataPromises = declinedInvites.map(async (invite) => {
        // The person who declined our invite (they would have been our mentor)
        const otherUserId = invite.mentorUid;

        // Find the thread with this user
        const thread = threads.find((t) => t.otherUserId === otherUserId);

        if (!thread) return null;

        // Fetch the user's display name
        try {
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userName = userDoc.exists()
            ? userDoc.data()?.displayName ||
              `user-${otherUserId.substring(0, 5)}`
            : `user-${otherUserId.substring(0, 5)}`;

          return {
            inviteId: invite.id,
            userName,
            userId: otherUserId,
            threadId: thread.id,
          };
        } catch (error) {
          console.error("Error fetching declined invite user data:", error);
          return null;
        }
      });

      const results = await Promise.all(inviteDataPromises);
      setDeclinedInvitesWithData(
        results.filter((item): item is InviteWithData => item !== null)
      );
    };

    if (declinedInvites.length > 0) {
      fetchDeclinedInviteData();
    } else {
      setDeclinedInvitesWithData([]);
    }
  }, [declinedInvites, threads]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 24, 48],
      [1, 0.4, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <View>
      <Animated.View style={[styles.header, animatedStyle]}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.iconCircleBackground },
            ]}
          >
            <IconSymbol
              name="person.crop.circle.badge.checkmark"
              size={20}
              color={colors.icon}
            />
          </View>
          <View style={styles.headerText}>
            <ThemedText
              type="title"
              style={[styles.headerTitle, { color: colors.text }]}
            >
              Supporting You
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Your accountability partner lead
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      {/* Show sent invites (including declined) if they exist */}
      {(sentInvitesWithData.length > 0 ||
        declinedInvitesWithData.length > 0) && (
        <View>
          <ThemedText
            type="captionMedium"
            style={{
              color: colors.textSecondary,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            ACCOUNTABILITY INVITES SENT
          </ThemedText>

          {/* ✅ Show declined invites first */}
          {declinedInvitesWithData.map((inviteData) => (
            <DeclinedInviteItem
              key={inviteData.inviteId}
              inviteId={inviteData.inviteId}
              userName={inviteData.userName}
              userId={inviteData.userId}
              threadId={inviteData.threadId}
              colors={colors}
            />
          ))}

          {/* Show sent invites after declined */}
          {sentInvitesWithData.map((inviteData) => (
            <SentInviteItem
              key={inviteData.inviteId}
              inviteId={inviteData.inviteId}
              userName={inviteData.userName}
              userId={inviteData.userId}
              threadId={inviteData.threadId}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 4,
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
