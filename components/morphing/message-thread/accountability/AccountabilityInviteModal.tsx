// components/morphing/message-thread/accountability/AccountabilityInviteModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/hooks/ThemeContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";

interface AccountabilityInviteModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  otherUserId: string;
  threadName: string;
  inviteState: "none" | "sent" | "received";
  pendingInvite?: any;
}

export function AccountabilityInviteModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  otherUserId,
  threadName,
  inviteState,
  pendingInvite,
}: AccountabilityInviteModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const currentUserId = auth.currentUser?.uid;

  // Get accountability functions and state from Context
  const { mentor, sendInvite, acceptInvite, declineInvite, cancelInvite } =
    useAccountability();
  const userHasMentor = !!mentor;

  // Check if other user has 3 mentees already
  const [otherUserMenteeCount, setOtherUserMenteeCount] = useState<
    number | null
  >(null);
  const [loadingMenteeCount, setLoadingMenteeCount] = useState(true);
  const otherUserHasMaxMentees =
    otherUserMenteeCount !== null && otherUserMenteeCount >= 3;

  // Load OTHER user's mentee count from their user document
  useEffect(() => {
    const fetchMenteeCount = async () => {
      if (!otherUserId || !isVisible) return;

      setLoadingMenteeCount(true);
      try {
        const userDoc = await getDoc(doc(db, "users", otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOtherUserMenteeCount(userData.menteeCount ?? 0);
        } else {
          setOtherUserMenteeCount(0);
        }
      } catch (error) {
        console.error("Error fetching mentee count:", error);
        setOtherUserMenteeCount(0);
      } finally {
        setLoadingMenteeCount(false);
      }
    };

    fetchMenteeCount();
  }, [otherUserId, isVisible]);

  // Handle sending invite
  const handleSendInvite = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      await sendInvite(otherUserId);
      Alert.alert(
        "Invite Sent",
        `Your accountability invite has been sent to ${threadName}.`
      );
      close();
    } catch (error) {
      console.error("Error sending invite:", error);
      Alert.alert("Error", "Failed to send invite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle canceling invite
  const handleCancelInvite = async () => {
    if (!pendingInvite) return;

    Alert.alert(
      "Cancel Invite",
      "Are you sure you want to cancel this invite?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await cancelInvite(pendingInvite.id);
              Alert.alert(
                "Invite Cancelled",
                "Your invite has been cancelled."
              );
              close();
            } catch (error) {
              console.error("Error cancelling invite:", error);
              Alert.alert(
                "Error",
                "Failed to cancel invite. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle accepting invite
  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;

    setIsLoading(true);
    try {
      await acceptInvite(pendingInvite.id);
      Alert.alert(
        "Invite Accepted!",
        `You are now accountability partners with ${threadName}.`
      );
      close();
    } catch (error) {
      console.error("Error accepting invite:", error);
      Alert.alert("Error", "Failed to accept invite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle declining invite
  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;

    Alert.alert(
      "Decline Invite",
      "Are you sure you want to decline this accountability invite?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await declineInvite(pendingInvite.id);
              Alert.alert("Invite Declined", "You declined the invite.");
              close();
            } catch (error) {
              console.error("Error declining invite:", error);
              Alert.alert(
                "Error",
                "Failed to decline invite. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Button content (the invite icon in its collapsed state)
  const buttonContent = (
    <View style={styles.buttonContent}>
      <IconSymbol
        name="person.badge.plus"
        size={24}
        color={colors.textSecondary}
      />
    </View>
  );

  // Render content based on invite state
  const renderModalContent = () => {
    // STATE: Invite sent (waiting for response)
    if (inviteState === "sent") {
      return (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.warning || "#FF9500"}20` },
              ]}
            >
              <IconSymbol
                name="clock.fill"
                size={32}
                color={colors.warning || "#FF9500"}
              />
            </View>
            <ThemedText
              type="title"
              style={[styles.title, { color: colors.text }]}
            >
              Invite Pending
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              You've invited {threadName} to be your accountability partner.
              They'll receive a notification to accept or decline your invite.
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: "#FF3B30",
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleCancelInvite}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.white }}
              >
                Cancel Invite
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => close()}
          >
            <ThemedText
              type="subtitleSemibold"
              style={{ color: colors.textSecondary }}
            >
              Close
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // STATE: Invite received (can accept or decline)
    if (inviteState === "received") {
      return (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.success || "#34C759"}20` },
              ]}
            >
              <IconSymbol
                name="bell.badge.fill"
                size={32}
                color={colors.success || "#34C759"}
              />
            </View>
            <ThemedText
              type="title"
              style={[styles.title, { color: colors.text }]}
            >
              Accountability Invite
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              {threadName} wants to be your accountability mentor. They'll help
              support your recovery journey and check in with you regularly.
            </ThemedText>
          </View>

          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.infoHeader}>
              <IconSymbol
                name="info.circle.fill"
                size={20}
                color={colors.tint}
              />
              <ThemedText
                type="subtitleSemibold"
                style={[styles.infoTitle, { color: colors.text }]}
              >
                What happens when you accept?
              </ThemedText>
            </View>
            <ThemedText
              type="body"
              style={[styles.infoText, { color: colors.textSecondary }]}
            >
              They'll be able to see your daily check-ins and recovery streak.
              You can message each other and they'll receive notifications when
              you might need support.
            </ThemedText>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.success || "#34C759",
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleAcceptInvite}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.white }}
              >
                Accept Invite
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: "#FF3B30" }]}
            onPress={handleDeclineInvite}
            disabled={isLoading}
          >
            <ThemedText type="subtitleSemibold" style={{ color: "#FF3B30" }}>
              Decline
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // STATE: No invite (can send one)
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View
            style={[styles.iconCircle, { backgroundColor: `${colors.tint}20` }]}
          >
            <IconSymbol name="person.2.fill" size={32} color={colors.tint} />
          </View>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            {userHasMentor
              ? "Already Have a Partner"
              : otherUserHasMaxMentees
              ? "Partner Unavailable"
              : "Accountability Partner"}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            {userHasMentor
              ? "You already have an accountability partner. You can only have one partner at a time."
              : otherUserHasMaxMentees
              ? `${
                  threadName || "This user"
                } already has 3 mentees and cannot accept more accountability partnerships.`
              : `Invite ${
                  threadName || "this user"
                } to be your accountability partner`}
          </ThemedText>
        </View>

        {/* What is this Section */}
        {!userHasMentor && !otherUserHasMaxMentees && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.infoHeader}>
              <IconSymbol
                name="info.circle.fill"
                size={20}
                color={colors.tint}
              />
              <ThemedText
                type="subtitleSemibold"
                style={[styles.infoTitle, { color: colors.text }]}
              >
                What is an Accountability Partner?
              </ThemedText>
            </View>
            <ThemedText
              type="body"
              style={[styles.infoText, { color: colors.textSecondary }]}
            >
              An accountability partner helps support you in your recovery
              journey. They can see your daily check-ins, encourage you, and be
              there when you need support.
            </ThemedText>
          </View>
        )}

        {/* Features Section */}
        {!userHasMentor && !otherUserHasMaxMentees && (
          <View style={styles.featuresSection}>
            <FeatureItem
              icon="checkmark.circle.fill"
              title="Daily Check-Ins"
              description="Share your daily status and progress"
              colors={colors}
            />
            <FeatureItem
              icon="bell.fill"
              title="Support Notifications"
              description="Get reminded when they need encouragement"
              colors={colors}
            />
            <FeatureItem
              icon="message.fill"
              title="Direct Communication"
              description="Stay connected through private messaging"
              colors={colors}
            />
            <FeatureItem
              icon="chart.bar.fill"
              title="Track Progress"
              description="See their recovery streak and milestones"
              colors={colors}
            />
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                userHasMentor || otherUserHasMaxMentees
                  ? colors.textSecondary
                  : colors.tint,
              opacity:
                isLoading ||
                userHasMentor ||
                otherUserHasMaxMentees ||
                loadingMenteeCount
                  ? 0.6
                  : 1,
            },
          ]}
          onPress={handleSendInvite}
          disabled={
            isLoading ||
            userHasMentor ||
            otherUserHasMaxMentees ||
            loadingMenteeCount
          }
          activeOpacity={0.8}
        >
          {isLoading || loadingMenteeCount ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <IconSymbol
                name={
                  userHasMentor || otherUserHasMaxMentees
                    ? "xmark.circle.fill"
                    : "paperplane.fill"
                }
                size={18}
                color={colors.white}
              />
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.white }}
              >
                {userHasMentor || otherUserHasMaxMentees
                  ? "Cannot Send Invite"
                  : "Send Invite"}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Note */}
        {!userHasMentor && !otherUserHasMaxMentees && (
          <ThemedText
            type="caption"
            style={[styles.note, { color: colors.textSecondary }]}
          >
            They will receive a notification and can choose to accept or decline
            your invitation.
          </ThemedText>
        )}
      </ScrollView>
    );
  };

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.iconCircleSecondaryBackground}
      buttonContentPadding={0}
      buttonBorderRadius={20}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
    >
      {renderModalContent()}
    </BaseModal>
  );
}

// Feature Item Component
function FeatureItem({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: any;
}) {
  return (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureIconCircle,
          { backgroundColor: `${colors.tint}15` },
        ]}
      >
        <IconSymbol name={icon} size={20} color={colors.tint} />
      </View>
      <View style={styles.featureText}>
        <ThemedText
          type="bodyMedium"
          style={[styles.featureTitle, { color: colors.text }]}
        >
          {title}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.featureDescription, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 4,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    flex: 1,
  },
  infoText: {
    lineHeight: 20,
    opacity: 0.9,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    marginBottom: 2,
  },
  featureDescription: {
    lineHeight: 16,
    opacity: 0.8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  note: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
