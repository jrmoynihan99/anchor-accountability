// components/morphing/message-thread/accountability/invite-views/GuidelinesView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface GuidelinesViewProps {
  colors: any;
  threadName: string;
  onBackPress: () => void;
  onConfirm: () => void;
}

export function GuidelinesView({
  colors,
  threadName,
  onBackPress,
  onConfirm,
}: GuidelinesViewProps) {
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleConfirm = () => {
    if (hasConfirmed) {
      onConfirm();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
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
            Partnership Guidelines
          </ThemedText>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}
        <View style={styles.introSection}>
          <ThemedText
            type="body"
            style={[styles.introText, { color: colors.text }]}
          >
            Before sending your invite to {threadName}, please read these
            guidelines carefully. They'll help both of you have a successful
            partnership.
          </ThemedText>
        </View>

        {/* Section 1: What This Partnership Is */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.tint}20` },
              ]}
            >
              <IconSymbol
                name="info.circle.fill"
                size={20}
                color={colors.tint}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              What This Partnership Is
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            style={[styles.bodyText, { color: colors.textSecondary }]}
          >
            This is a peer accountability partnership. Both of you are real
            people, both navigating your own challenges. You’re asking{" "}
            {threadName} to walk with you and be a steady presence as you build
            honesty and consistency in your recovery.
          </ThemedText>
        </View>

        {/* Section 2: Your Responsibilities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.tint}20` },
              ]}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                color={colors.tint}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Your Role
            </ThemedText>
          </View>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Check in daily, even when it’s uncomfortable"
              colors={colors}
            />
            <BulletPoint
              text="Be honest about where you’re at"
              colors={colors}
            />
            <BulletPoint
              text="Reach out when you feel tempted or stuck"
              colors={colors}
            />
            <BulletPoint
              text="Stay communicative and respectful of their time"
              colors={colors}
            />
          </View>
        </View>

        {/* Section 3: Their Responsibilities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.tint}20` },
              ]}
            >
              <IconSymbol
                name="person.circle.fill"
                size={20}
                color={colors.tint}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Their Role
            </ThemedText>
          </View>
          <View style={styles.bulletList}>
            <BulletPoint text="Be present and responsive" colors={colors} />
            <BulletPoint
              text="Be vulnerable and provide guidance"
              colors={colors}
            />
            <BulletPoint
              text="Respond with grace and love, never judgment"
              colors={colors}
            />
            <BulletPoint
              text="Help you stay grounded when things get hard"
              colors={colors}
            />
          </View>
        </View>

        {/* Section 4: Important Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.warning || "#FF9500"}20` },
              ]}
            >
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={20}
                color={colors.warning || "#FF9500"}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Important Notes
            </ThemedText>
          </View>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Your recovery is ultimately your responsibility"
              colors={colors}
              bold
            />
            <BulletPoint
              text="Either party can end the partnership anytime, no hard feelings"
              colors={colors}
            />
            <BulletPoint
              text="This is not a replacement for professional help"
              colors={colors}
            />
          </View>
        </View>

        {/* Section 5: Commitment Level */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.success || "#34C759"}20` },
              ]}
            >
              <IconSymbol
                name="heart.fill"
                size={20}
                color={colors.success || "#34C759"}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Are You Ready?
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            style={[styles.bodyText, { color: colors.textSecondary }]}
          >
            This partnership requires daily engagement from both parties. If
            you're not ready for that level of commitment right now, that's
            completely okay - anonymous support is still available to you
            anytime.
          </ThemedText>
        </View>

        {/* Checkbox Confirmation */}
        <TouchableOpacity
          style={[
            styles.checkboxContainer,
            {
              backgroundColor: colors.background,
              borderColor: hasConfirmed ? colors.tint : colors.border,
            },
          ]}
          onPress={() => setHasConfirmed(!hasConfirmed)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: hasConfirmed ? colors.tint : "transparent",
                borderColor: hasConfirmed ? colors.tint : colors.border,
              },
            ]}
          >
            {hasConfirmed && (
              <IconSymbol name="checkmark" size={16} color={colors.white} />
            )}
          </View>
          <ThemedText
            type="body"
            style={[styles.checkboxText, { color: colors.text }]}
          >
            I understand what this partnership involves and I’m ready to show up
            honestly and consistently.
          </ThemedText>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: hasConfirmed ? colors.tint : colors.border,
              opacity: hasConfirmed ? 1 : 0.6,
            },
          ]}
          onPress={handleConfirm}
          disabled={!hasConfirmed}
          activeOpacity={0.8}
        >
          <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
            Continue to Send Invite
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Bullet Point Component
function BulletPoint({
  text,
  colors,
  bold = false,
}: {
  text: string;
  colors: any;
  bold?: boolean;
}) {
  return (
    <View style={styles.bulletPoint}>
      <View style={styles.bulletDot}>
        <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
      </View>
      <ThemedText
        type={bold ? "bodyMedium" : "body"}
        style={[
          styles.bulletText,
          { color: colors.textSecondary },
          bold && { fontWeight: "600" },
        ]}
      >
        {text}
      </ThemedText>
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
  introSection: {
    marginBottom: 24,
  },
  introText: {
    lineHeight: 22,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
  },
  bodyText: {
    lineHeight: 22,
    opacity: 0.9,
  },
  bulletList: {
    gap: 12,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 20,
    paddingTop: 8,
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
    opacity: 0.9,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    lineHeight: 22,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
