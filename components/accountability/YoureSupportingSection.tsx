// components/messages/YoureSupportingSection.tsx
import { PartnershipInfoButton } from "@/components/morphing/accountability/partnership-info/PartnershipInfoButton";
import { PartnershipInfoModal } from "@/components/morphing/accountability/partnership-info/PartnershipInfoModal";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import { useOrganization } from "@/context/OrganizationContext";
import { useTheme } from "@/context/ThemeContext";
import { useThreads } from "@/hooks/messages/useThreads";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { ReceivedInviteItem } from "../ReceivedInviteItem";

interface InviteWithData {
  inviteId: string;
  userName: string;
  userId: string;
  threadId: string;
}

export function YoureSupportingSection() {
  const { organizationId } = useOrganization();
  const { colors } = useTheme();
  const { receivedInvites } = useAccountability();
  const { threads } = useThreads();
  const [invitesWithData, setInvitesWithData] = useState<InviteWithData[]>([]);

  useEffect(() => {
    const fetchInviteData = async () => {
      if (!organizationId) return;
      const inviteDataPromises = receivedInvites.map(async (invite) => {
        // The person who sent us the invite (they want us as their mentor)
        const otherUserId = invite.menteeUid;

        // Find the thread with this user
        const thread = threads.find((t) => t.otherUserId === otherUserId);

        if (!thread) return null;

        // Fetch the user's display name
        try {
          const userDoc = await getDoc(
            doc(db, "organizations", organizationId, "users", otherUserId)
          );
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
      setInvitesWithData(
        results.filter((item): item is InviteWithData => item !== null)
      );
    };

    if (receivedInvites.length > 0) {
      fetchInviteData();
    } else {
      setInvitesWithData([]);
    }
  }, [receivedInvites, threads]);

  return (
    <View>
      <Animated.View style={[styles.header]}>
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
            <View style={styles.titleRow}>
              <ThemedText
                type="title"
                style={[styles.headerTitle, { color: colors.text }]}
              >
                People You're Supporting
              </ThemedText>
              {/* Info button modal */}
              <ButtonModalTransitionBridge
                buttonBorderRadius={12}
                modalBorderRadius={28}
                modalWidthPercent={0.9}
                modalHeightPercent={0.7}
                buttonFadeThreshold={0.01}
              >
                {({
                  open,
                  close,
                  isModalVisible,
                  progress,
                  buttonAnimatedStyle,
                  modalAnimatedStyle,
                  buttonRef,
                  handlePressIn,
                  handlePressOut,
                }) => (
                  <>
                    <PartnershipInfoButton
                      colors={colors}
                      onPress={open}
                      buttonRef={buttonRef}
                      style={buttonAnimatedStyle}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                    />

                    <PartnershipInfoModal
                      isVisible={isModalVisible}
                      progress={progress}
                      modalAnimatedStyle={modalAnimatedStyle}
                      close={close}
                    />
                  </>
                )}
              </ButtonModalTransitionBridge>
            </View>
            <ThemedText
              type="caption"
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              People you're supporting through recovery
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      {/* Show received invites if they exist */}
      {invitesWithData.length > 0 && (
        <View>
          {invitesWithData.map((inviteData) => (
            <ReceivedInviteItem
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
    marginTop: 12,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    lineHeight: 22,
  },
  headerSubtitle: {
    marginTop: 1,
    opacity: 0.8,
  },
});
