import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { AccountabilityMessagesContent } from "../messages/AccountabilityMessagesContent";
import { BaseModal } from "./BaseModal";
import { AccountabilityHomeContent } from "./home/accountability/AccountabilityHomeContent";

interface AccountabilityListModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  variant?: "home" | "messages"; // NEW: to determine which button content to show
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
          <TouchableOpacity
            style={[
              styles.partnerRow,
              {
                backgroundColor: colors.modalCardBackground,
                borderColor: colors.modalCardBorder,
              },
            ]}
            onPress={() => {
              close();
              router.push({
                pathname: "/accountability-dashboard",
                params: {
                  relationshipId: mentor.id,
                  role: "mentor",
                },
              });
            }}
            activeOpacity={0.7}
          >
            <View style={styles.partnerContent}>
              <View
                style={[
                  styles.partnerAvatar,
                  { backgroundColor: colors.iconCircleSecondaryBackground },
                ]}
              >
                <ThemedText type="caption" style={{ color: colors.icon }}>
                  {mentor.mentorUid[0]?.toUpperCase() || "U"}
                </ThemedText>
              </View>
              <ThemedText type="title">
                user-{mentor.mentorUid.slice(0, 5)}
              </ThemedText>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
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
            return (
              <TouchableOpacity
                key={mentee.id}
                style={[
                  styles.partnerRow,
                  {
                    backgroundColor: colors.modalCardBackground,
                    borderColor: colors.modalCardBorder,
                    marginBottom: 8,
                  },
                ]}
                onPress={() => {
                  close();
                  router.push({
                    pathname: "/accountability-dashboard",
                    params: {
                      relationshipId: mentee.id,
                      role: "mentee",
                    },
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.partnerContent}>
                  <View
                    style={[
                      styles.partnerAvatar,
                      { backgroundColor: colors.iconCircleSecondaryBackground },
                    ]}
                  >
                    <ThemedText type="caption" style={{ color: colors.icon }}>
                      {mentee.menteeUid[0]?.toUpperCase() || "U"}
                    </ThemedText>
                  </View>
                  <ThemedText type="title">
                    user-{mentee.menteeUid.slice(0, 5)}
                  </ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
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
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
  },
  partnerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
});
