import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { MentorCardContent } from "./MentorCardContent";

interface MentorModalProps {
  mentorUid: string;
  streak: number;
  lastCheckIn: string | null;
  relationshipId: string;
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

type CheckInStatus = "clean" | "struggled" | "relapsed" | null;

export function MentorModal({
  mentorUid,
  streak,
  lastCheckIn,
  relationshipId,
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: MentorModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<CheckInStatus>(null);
  const [note, setNote] = useState("");

  const handleCheckIn = () => {
    // TODO: Submit check-in to Firestore
    console.log("Check-in:", selectedStatus, note);
    // Reset and close
    setSelectedStatus(null);
    setNote("");
    close();
  };

  const buttonContent = (
    <View style={styles.buttonContent}>
      <MentorCardContent
        mentorUid={mentorUid}
        streak={streak}
        lastCheckIn={lastCheckIn}
        showExpandIcon={true}
      />
    </View>
  );

  const modalContent = (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <ThemedText style={{ fontSize: 48, lineHeight: 48, marginBottom: 12 }}>
          🙏
        </ThemedText>
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginBottom: 4 }}
        >
          Daily Check-In
        </ThemedText>
        <ThemedText
          type="subtitleMedium"
          lightColor={colors.textSecondary}
          darkColor={colors.textSecondary}
          style={{ textAlign: "center", opacity: 0.8 }}
        >
          with user-{mentorUid.slice(0, 5)}
        </ThemedText>
      </View>

      {/* Check-In Form */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText
          type="subtitleMedium"
          style={{ marginBottom: 16, color: colors.text }}
        >
          How was yesterday?
        </ThemedText>

        <TouchableOpacity
          style={[
            styles.statusOption,
            {
              backgroundColor:
                selectedStatus === "clean"
                  ? colors.buttonBackground
                  : colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSelectedStatus("clean")}
        >
          <ThemedText style={{ fontSize: 24, marginRight: 12 }}>✅</ThemedText>
          <ThemedText
            type="bodyMedium"
            style={{
              color: selectedStatus === "clean" ? colors.white : colors.text,
            }}
          >
            Stayed clean
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusOption,
            {
              backgroundColor:
                selectedStatus === "struggled"
                  ? colors.buttonBackground
                  : colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSelectedStatus("struggled")}
        >
          <ThemedText style={{ fontSize: 24, marginRight: 12 }}>⚠️</ThemedText>
          <ThemedText
            type="bodyMedium"
            style={{
              color:
                selectedStatus === "struggled" ? colors.white : colors.text,
            }}
          >
            Struggled but made it
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusOption,
            {
              backgroundColor:
                selectedStatus === "relapsed"
                  ? colors.buttonBackground
                  : colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSelectedStatus("relapsed")}
        >
          <ThemedText style={{ fontSize: 24, marginRight: 12 }}>💔</ThemedText>
          <ThemedText
            type="bodyMedium"
            style={{
              color: selectedStatus === "relapsed" ? colors.white : colors.text,
            }}
          >
            Relapsed
          </ThemedText>
        </TouchableOpacity>

        {/* Submit Button */}
        {selectedStatus && (
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.buttonBackground },
            ]}
            onPress={handleCheckIn}
          >
            <ThemedText type="button" style={{ color: colors.white }}>
              Submit Check-In
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Your Streaks */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText
          type="subtitleMedium"
          style={{ marginBottom: 16, color: colors.text }}
        >
          Your Streaks
        </ThemedText>
        <View style={styles.streaksRow}>
          <View style={styles.streakItem}>
            <ThemedText style={{ fontSize: 32, marginBottom: 4 }}>
              🔥
            </ThemedText>
            <ThemedText type="title" style={{ color: colors.text }}>
              12 days
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              Recovery
            </ThemedText>
          </View>
          <View style={styles.streakItem}>
            <ThemedText style={{ fontSize: 32, marginBottom: 4 }}>
              🤝
            </ThemedText>
            <ThemedText type="title" style={{ color: colors.text }}>
              45 days
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              Check-ins
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Recent Check-Ins */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText
          type="subtitleMedium"
          style={{ marginBottom: 16, color: colors.text }}
        >
          Recent Check-Ins (Last 7 Days)
        </ThemedText>
        <View style={styles.checkInHistory}>
          {["✅", "✅", "✅", "⚠️", "✅", "✅", "✅"].map((status, i) => (
            <View
              key={i}
              style={[
                styles.historyDot,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <ThemedText style={{ fontSize: 20 }}>{status}</ThemedText>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => {
            close();
            router.push({
              pathname: "/accountability-dashboard",
              params: {
                relationshipId,
                role: "mentor",
              },
            });
          }}
        >
          <ThemedText
            type="captionMedium"
            style={{ color: colors.textSecondary }}
          >
            View full history
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Message Button */}
      <TouchableOpacity
        style={[
          styles.messageButton,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
        onPress={() => {
          // TODO: Open DM with mentor
          console.log("Open DM");
        }}
      >
        <IconSymbol
          name="message"
          size={20}
          color={colors.text}
          style={{ marginRight: 8 }}
        />
        <ThemedText type="bodyMedium" style={{ color: colors.text }}>
          Message Your Mentor
        </ThemedText>
      </TouchableOpacity>
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
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  streaksRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  streakItem: {
    alignItems: "center",
  },
  checkInHistory: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
});
