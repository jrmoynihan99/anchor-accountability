// components/accountability/AccountabilityPartnerSelector.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface AccountabilityWithId {
  id: string;
  mentorUid: string;
  menteeUid: string;
  streak: number;
  lastCheckIn: string | null;
}

interface AccountabilityPartnerSelectorProps {
  mentor: AccountabilityWithId | null;
  mentees: AccountabilityWithId[];
  selectedRelationshipId: string;
  selectedRole: "mentor" | "mentee";
  onPartnerSelect: (relationshipId: string, role: "mentor" | "mentee") => void;
}

export function AccountabilityPartnerSelector({
  mentor,
  mentees,
  selectedRelationshipId,
  selectedRole,
  onPartnerSelect,
}: AccountabilityPartnerSelectorProps) {
  const { colors } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get currently selected partner info
  const currentPartner =
    selectedRole === "mentor"
      ? mentor
      : mentees.find((m) => m.id === selectedRelationshipId);

  const currentPartnerUid =
    selectedRole === "mentor"
      ? currentPartner?.mentorUid
      : currentPartner?.menteeUid;

  const currentPartnerLabel = selectedRole === "mentor" ? "Mentor" : "Mentee";

  const handleSelect = (relationshipId: string, role: "mentor" | "mentee") => {
    onPartnerSelect(relationshipId, role);
    setIsDropdownOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Selector Button */}
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setIsDropdownOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectedPartnerInfo}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.iconCircleSecondaryBackground },
            ]}
          >
            <ThemedText type="caption" style={{ color: colors.icon }}>
              {currentPartnerUid?.[0]?.toUpperCase() || "U"}
            </ThemedText>
          </View>
          <View style={styles.textContainer}>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {currentPartnerLabel}
            </ThemedText>
            <ThemedText type="bodyMedium" style={{ color: colors.text }}>
              user-{currentPartnerUid?.slice(0, 5)}
            </ThemedText>
          </View>
        </View>
        <IconSymbol
          name="chevron.down"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { backgroundColor: colors.cardBackground },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.dropdownHeader}>
              <ThemedText type="title" style={{ color: colors.text }}>
                Switch Partner
              </ThemedText>
              <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                <IconSymbol
                  name="xmark"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dropdownScroll}>
              {/* Mentor Section */}
              {mentor && (
                <View style={styles.section}>
                  <ThemedText
                    type="captionMedium"
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    YOUR MENTOR
                  </ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      {
                        backgroundColor:
                          selectedRole === "mentor" &&
                          selectedRelationshipId === mentor.id
                            ? colors.modalCardBackground
                            : "transparent",
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSelect(mentor.id, "mentor")}
                  >
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: colors.iconCircleSecondaryBackground,
                        },
                      ]}
                    >
                      <ThemedText type="caption" style={{ color: colors.icon }}>
                        {mentor.mentorUid[0]?.toUpperCase() || "U"}
                      </ThemedText>
                    </View>
                    <ThemedText
                      type="bodyMedium"
                      style={{ color: colors.text }}
                    >
                      user-{mentor.mentorUid.slice(0, 5)}
                    </ThemedText>
                    {selectedRole === "mentor" &&
                      selectedRelationshipId === mentor.id && (
                        <IconSymbol
                          name="checkmark"
                          size={20}
                          color={colors.tint}
                          style={styles.checkmark}
                        />
                      )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Mentees Section */}
              {mentees.length > 0 && (
                <View style={styles.section}>
                  <ThemedText
                    type="captionMedium"
                    style={[
                      styles.sectionTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    YOUR MENTEES
                  </ThemedText>
                  {mentees.map((mentee) => (
                    <TouchableOpacity
                      key={mentee.id}
                      style={[
                        styles.dropdownItem,
                        {
                          backgroundColor:
                            selectedRole === "mentee" &&
                            selectedRelationshipId === mentee.id
                              ? colors.modalCardBackground
                              : "transparent",
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => handleSelect(mentee.id, "mentee")}
                    >
                      <View
                        style={[
                          styles.avatar,
                          {
                            backgroundColor:
                              colors.iconCircleSecondaryBackground,
                          },
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={{ color: colors.icon }}
                        >
                          {mentee.menteeUid[0]?.toUpperCase() || "U"}
                        </ThemedText>
                      </View>
                      <ThemedText
                        type="bodyMedium"
                        style={{ color: colors.text }}
                      >
                        user-{mentee.menteeUid.slice(0, 5)}
                      </ThemedText>
                      {selectedRole === "mentee" &&
                        selectedRelationshipId === mentee.id && (
                          <IconSymbol
                            name="checkmark"
                            size={20}
                            color={colors.tint}
                            style={styles.checkmark}
                          />
                        )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedPartnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    width: "85%",
    maxHeight: "70%",
    borderRadius: 16,
    padding: 20,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dropdownScroll: {
    maxHeight: 400,
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
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  checkmark: {
    marginLeft: "auto",
  },
});
