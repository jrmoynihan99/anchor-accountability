import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { AccountabilityHomeContent } from "./home/accountability/AccountabilityHomeContent";
import { AccountabilityMessagesContent } from "../messages/AccountabilityMessagesContent";
import { BaseModal } from "./BaseModal";

interface AccountabilityListModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  variant?: "home" | "messages"; // NEW: to determine which button content to show
}

interface UserInfo {
  displayName?: string;
  email?: string;
}

export function AccountabilityListModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  variant = "messages", // Default to messages variant
}: AccountabilityListModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const { mentor, mentees, loading } = useAccountabilityRelationships();

  const [mentorInfo, setMentorInfo] = useState<UserInfo | null>(null);
  const [menteesInfo, setMenteesInfo] = useState<
    Record<string, UserInfo | null>
  >({});

  // Fetch user info for mentor
  useEffect(() => {
    if (!mentor) return;

    const fetchMentorInfo = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", mentor.mentorUid));
        if (userDoc.exists()) {
          setMentorInfo(userDoc.data() as UserInfo);
        }
      } catch (err) {
        console.error("Failed to fetch mentor info:", err);
      }
    };

    fetchMentorInfo();
  }, [mentor]);

  // Fetch user info for all mentees
  useEffect(() => {
    if (mentees.length === 0) return;

    const fetchMenteesInfo = async () => {
      const infoMap: Record<string, UserInfo | null> = {};

      await Promise.all(
        mentees.map(async (mentee) => {
          try {
            const userDoc = await getDoc(doc(db, "users", mentee.menteeUid));
            if (userDoc.exists()) {
              infoMap[mentee.menteeUid] = userDoc.data() as UserInfo;
            }
          } catch (err) {
            console.error(
              `Failed to fetch mentee info for ${mentee.menteeUid}:`,
              err
            );
          }
        })
      );

      setMenteesInfo(infoMap);
    };

    fetchMenteesInfo();
  }, [mentees]);

  const buttonContent = (
    <View style={styles.buttonContent}>
      {variant === "home" ? (
        <AccountabilityHomeContent showExpandIcon={true} />
      ) : (
        <AccountabilityMessagesContent showExpandIcon={true} />
      )}
    </View>
  );

  const modalContent = (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <ThemedText style={{ fontSize: 48, lineHeight: 48, marginBottom: 12 }}>
          🤝
        </ThemedText>
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginBottom: 4 }}
        >
          Accountability Partners
        </ThemedText>
        <ThemedText
          type="subtitleMedium"
          lightColor={colors.textSecondary}
          darkColor={colors.textSecondary}
          style={{ textAlign: "center", opacity: 0.8 }}
        >
          Supporting each other in faith
        </ThemedText>
      </View>

      {/* My Mentor Section */}
      {mentor && (
        <View style={styles.section}>
          <ThemedText
            type="subtitleMedium"
            style={[styles.sectionTitle, { color: colors.textSecondary }]}
          >
            MY MENTOR
          </ThemedText>
          <View
            style={[
              styles.partnerCard,
              {
                backgroundColor: colors.modalCardBackground,
                borderColor: colors.modalCardBorder,
              },
            ]}
          >
            <View style={styles.partnerHeader}>
              <View style={styles.partnerInfo}>
                <ThemedText type="title" style={{ marginBottom: 4 }}>
                  {mentorInfo?.displayName || "Loading..."}
                </ThemedText>
                {mentorInfo?.email && (
                  <ThemedText
                    type="caption"
                    style={{ color: colors.textSecondary, opacity: 0.8 }}
                  >
                    {mentorInfo.email}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Streak Info */}
            <View style={styles.streakContainer}>
              <View style={styles.streakBadge}>
                <ThemedText style={{ fontSize: 24, marginBottom: 4 }}>
                  🔥
                </ThemedText>
                <ThemedText type="title" style={{ marginBottom: 2 }}>
                  {mentor.streak}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                >
                  day streak
                </ThemedText>
              </View>

              <View style={styles.checkInInfo}>
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary, marginBottom: 4 }}
                >
                  Last check-in:
                </ThemedText>
                <ThemedText type="subtitleMedium">
                  {mentor.lastCheckIn || "Never"}
                </ThemedText>
              </View>
            </View>

            {/* Message Button */}
            <TouchableOpacity
              style={[
                styles.messageButton,
                { backgroundColor: colors.buttonBackground },
              ]}
              onPress={() => {
                // TODO: Navigate to DM with mentor
                close();
              }}
            >
              <IconSymbol
                name="message"
                size={18}
                color={colors.white}
                style={{ marginRight: 8 }}
              />
              <ThemedText type="button" style={{ color: colors.white }}>
                Message
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* My Mentees Section */}
      {mentees.length > 0 && (
        <View style={styles.section}>
          <ThemedText
            type="subtitleMedium"
            style={[styles.sectionTitle, { color: colors.textSecondary }]}
          >
            MY MENTEES
          </ThemedText>
          {mentees.map((mentee) => {
            const info = menteesInfo[mentee.menteeUid];
            return (
              <View
                key={mentee.id}
                style={[
                  styles.partnerCard,
                  {
                    backgroundColor: colors.modalCardBackground,
                    borderColor: colors.modalCardBorder,
                    marginBottom: 12,
                  },
                ]}
              >
                <View style={styles.partnerHeader}>
                  <View style={styles.partnerInfo}>
                    <ThemedText type="title" style={{ marginBottom: 4 }}>
                      {info?.displayName || "Loading..."}
                    </ThemedText>
                    {info?.email && (
                      <ThemedText
                        type="caption"
                        style={{ color: colors.textSecondary, opacity: 0.8 }}
                      >
                        {info.email}
                      </ThemedText>
                    )}
                  </View>
                </View>

                {/* Streak Info */}
                <View style={styles.streakContainer}>
                  <View style={styles.streakBadge}>
                    <ThemedText style={{ fontSize: 24, marginBottom: 4 }}>
                      🔥
                    </ThemedText>
                    <ThemedText type="title" style={{ marginBottom: 2 }}>
                      {mentee.streak}
                    </ThemedText>
                    <ThemedText
                      type="caption"
                      style={{ color: colors.textSecondary }}
                    >
                      day streak
                    </ThemedText>
                  </View>

                  <View style={styles.checkInInfo}>
                    <ThemedText
                      type="caption"
                      style={{ color: colors.textSecondary, marginBottom: 4 }}
                    >
                      Last check-in:
                    </ThemedText>
                    <ThemedText type="subtitleMedium">
                      {mentee.lastCheckIn || "Never"}
                    </ThemedText>
                  </View>
                </View>

                {/* Message Button */}
                <TouchableOpacity
                  style={[
                    styles.messageButton,
                    { backgroundColor: colors.buttonBackground },
                  ]}
                  onPress={() => {
                    // TODO: Navigate to DM with mentee
                    close();
                  }}
                >
                  <IconSymbol
                    name="message"
                    size={18}
                    color={colors.white}
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText type="button" style={{ color: colors.white }}>
                    Message
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {!mentor && mentees.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <IconSymbol
            name="person.2"
            size={48}
            color={colors.textSecondary}
            style={{ marginBottom: 16, opacity: 0.6 }}
          />
          <ThemedText
            type="subtitleMedium"
            style={{ color: colors.textSecondary, marginBottom: 8 }}
          >
            No Accountability Partners Yet
          </ThemedText>
          <ThemedText
            type="caption"
            style={{
              color: colors.textSecondary,
              opacity: 0.8,
              textAlign: "center",
            }}
          >
            Connect with someone to start supporting each other in your faith
            journey
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonContent={buttonContent}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: "stretch",
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 12,
    opacity: 0.7,
  },
  partnerCard: {
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
  },
  partnerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  partnerInfo: {
    flex: 1,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 24,
  },
  streakBadge: {
    alignItems: "center",
  },
  checkInInfo: {
    flex: 1,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
});
