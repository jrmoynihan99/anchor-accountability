// components/morphing/settings/BlockListView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { auth, db } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import {
  collection,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface BlockListViewProps {
  onBackPress: () => void;
  colors: any;
}

export function BlockListView({ onBackPress, colors }: BlockListViewProps) {
  const { blockedUserIds, loading } = useBlockedUsers();
  const [unblocking, setUnblocking] = useState<Set<string>>(new Set());

  const handleUnblock = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Unblock User?",
      "This user will be able to interact with you again and their content will be visible.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unblock",
          style: "default",
          onPress: async () => {
            await performUnblock(userId);
          },
        },
      ]
    );
  };

  const performUnblock = async (userId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setUnblocking((prev) => new Set(prev).add(userId));

    try {
      // Find and delete the block document
      const blockListRef = collection(
        db,
        "users",
        currentUser.uid,
        "blockList"
      );
      const q = query(blockListRef, where("uid", "==", userId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
      }

      // ✅ NEW: Restore any "blocked" accountability relationships back to "active"
      await restoreAccountabilityRelationships(currentUser.uid, userId);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error unblocking user:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to unblock user. Please try again.");
    } finally {
      setUnblocking((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const restoreAccountabilityRelationships = async (
    currentUserId: string,
    unblockedUserId: string
  ) => {
    try {
      // Find relationships where current user is the mentor
      const asMentorQuery = query(
        collection(db, "accountabilityRelationships"),
        where("mentorUid", "==", currentUserId),
        where("menteeUid", "==", unblockedUserId),
        where("status", "==", "blocked")
      );

      // Find relationships where current user is the mentee
      const asMenteeQuery = query(
        collection(db, "accountabilityRelationships"),
        where("mentorUid", "==", unblockedUserId),
        where("menteeUid", "==", currentUserId),
        where("status", "==", "blocked")
      );

      const [asMentorSnap, asMenteeSnap] = await Promise.all([
        getDocs(asMentorQuery),
        getDocs(asMenteeQuery),
      ]);

      // Update all found relationships back to "active"
      const updatePromises = [
        ...asMentorSnap.docs.map((doc) =>
          updateDoc(doc.ref, {
            status: "active",
            updatedAt: serverTimestamp(),
          })
        ),
        ...asMenteeSnap.docs.map((doc) =>
          updateDoc(doc.ref, {
            status: "active",
            updatedAt: serverTimestamp(),
          })
        ),
      ];

      await Promise.all(updatePromises);

      if (updatePromises.length > 0) {
        console.log(
          `✅ Restored ${updatePromises.length} accountability relationship(s) to active status`
        );
      }
    } catch (err) {
      console.error("Error restoring accountability relationships:", err);
    }
  };

  const blockedUserArray = Array.from(blockedUserIds);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={onBackPress}
          size={36}
          iconSize={18}
          backgroundColor={colors.buttonBackground}
        />
        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Blocked Users
          </ThemedText>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : blockedUserArray.length === 0 ? (
          <View style={styles.centerContent}>
            <IconSymbol
              name="hand.raised.slash"
              size={48}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <ThemedText
              type="bodyMedium"
              style={[styles.emptyTitle, { color: colors.text }]}
            >
              No Blocked Users
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              When you block someone, they'll appear here
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {blockedUserArray.map((userId) => (
              <View
                key={userId}
                style={[
                  styles.userItem,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.iconCircleSecondaryBackground },
                  ]}
                >
                  <ThemedText type="caption" style={{ color: colors.icon }}>
                    {userId[5]?.toUpperCase() ||
                      userId[0]?.toUpperCase() ||
                      "U"}
                  </ThemedText>
                </View>

                <View style={styles.userInfo}>
                  <ThemedText
                    type="bodyMedium"
                    style={[styles.username, { color: colors.text }]}
                  >
                    user-{userId.substring(0, 5)}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={[styles.userStatus, { color: colors.textSecondary }]}
                  >
                    Blocked • No longer visible
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[
                    styles.unblockButton,
                    {
                      backgroundColor: colors.tint,
                      opacity: unblocking.has(userId) ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => handleUnblock(userId)}
                  disabled={unblocking.has(userId)}
                >
                  {unblocking.has(userId) ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <ThemedText
                      type="caption"
                      style={[styles.unblockText, { color: colors.white }]}
                    >
                      Unblock
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Info Footer */}
        {!loading && blockedUserArray.length > 0 && (
          <View
            style={[styles.infoCard, { backgroundColor: colors.background }]}
          >
            <IconSymbol
              name="info.circle"
              size={20}
              color={colors.textSecondary}
              style={styles.infoIcon}
            />
            <ThemedText
              type="caption"
              style={[styles.infoText, { color: colors.textSecondary }]}
            >
              Blocked users cannot see your content or interact with you.
              Unblocking them will restore normal interactions.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    opacity: 0.8,
  },
  list: {
    gap: 12,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    marginBottom: 4,
  },
  userStatus: {
    opacity: 0.8,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  unblockText: {
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
    opacity: 0.9,
  },
});
