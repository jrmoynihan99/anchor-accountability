// ReachOutConfirmationScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface ReachOutConfirmationScreenProps {
  onClose: () => void;
  onGuidedPrayer?: () => void;
}

interface RecommendedAction {
  icon: string;
  title: string;
  subtitle: string;
  action?: () => void;
}

export function ReachOutConfirmationScreen({
  onClose,
  onGuidedPrayer,
}: ReachOutConfirmationScreenProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  // Using the exact color that matches your hardcoded #3A2D28
  // This is colors.background in dark mode and colors.text in light mode
  const mainTextColor = theme === "dark" ? colors.background : colors.text;

  const recommendedActions: RecommendedAction[] = [
    {
      icon: "book",
      title: "Read Scripture",
      subtitle: "Find peace in God's word",
      // No action property = non-interactive
    },
    {
      icon: "walk",
      title: "Take a Walk",
      subtitle: "Get some fresh air",
      // No action property = non-interactive
    },
    {
      icon: "heart",
      title: "Guided Prayer",
      subtitle: "Connect with God",
      action: onGuidedPrayer, // Only this one has an action
    },
  ];

  const handleDonePress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Call the original onClose function
    onClose();
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header with Icon */}
      <View style={styles.modalHeader}>
        <Ionicons name="checkmark-circle" size={40} color={mainTextColor} />
        <ThemedText
          type="titleLarge"
          style={[
            styles.title,
            {
              color: mainTextColor,
              marginTop: 12,
              textAlign: "center",
            },
          ]}
        >
          Message Sent!
        </ThemedText>
      </View>

      <ThemedText
        type="body"
        style={[
          styles.description,
          {
            color: colors.textMuted,
            lineHeight: 22,
            textAlign: "center",
            marginBottom: 24,
          },
        ]}
      >
        Your anonymous request has been sent to the community. Sit tight -
        people will be responding with encouragement soon.
      </ThemedText>

      <View style={styles.recommendationsContainer}>
        <ThemedText
          type="xl"
          style={[
            styles.recommendationsTitle,
            {
              color: mainTextColor,
              marginBottom: 16,
              textAlign: "center",
            },
          ]}
        >
          While you wait:
        </ThemedText>

        {recommendedActions.map((action, index) => {
          const isInteractive = !!action.action;

          if (isInteractive) {
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: colors.modalCardBackground,
                    borderColor: colors.modalCardBorder,
                  },
                ]}
                onPress={action.action}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.recommendationIconContainer,
                    {
                      backgroundColor: colors.iconCircleSecondaryBackground,
                    },
                  ]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={24}
                    color={mainTextColor}
                  />
                </View>
                <View style={styles.recommendationText}>
                  <ThemedText
                    type="body"
                    style={[
                      styles.recommendationTitle,
                      {
                        color: mainTextColor,
                        marginBottom: 2,
                      },
                    ]}
                  >
                    {action.title}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.recommendationSubtitle,
                      { color: colors.textMuted },
                    ]}
                  >
                    {action.subtitle}
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            );
          } else {
            return (
              <View
                key={index}
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: colors.modalCardBackground,
                    borderColor: colors.modalCardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.recommendationIconContainer,
                    {
                      backgroundColor: colors.iconCircleSecondaryBackground,
                    },
                  ]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={24}
                    color={mainTextColor}
                  />
                </View>
                <View style={styles.recommendationText}>
                  <ThemedText
                    type="body"
                    style={[
                      styles.recommendationTitle,
                      {
                        color: mainTextColor,
                        marginBottom: 2,
                      },
                    ]}
                  >
                    {action.title}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.recommendationSubtitle,
                      { color: colors.textMuted },
                    ]}
                  >
                    {action.subtitle}
                  </ThemedText>
                </View>
              </View>
            );
          }
        })}
      </View>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: mainTextColor }]}
        onPress={handleDonePress}
      >
        <ThemedText
          type="buttonLarge"
          style={[styles.doneButtonText, { color: colors.white }]}
        >
          Done
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
  },
  title: {
    // Typography styles moved to Typography.styles.titleLarge + inline styles
  },
  description: {
    // Typography styles moved to Typography.styles.body + inline styles
  },
  recommendationsContainer: {
    width: "100%",
    marginBottom: 12,
  },
  recommendationsTitle: {
    // Typography styles moved to Typography.styles.xl + inline styles
  },
  recommendationCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  recommendationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  recommendationText: {
    flex: 1,
  },
  recommendationTitle: {
    // Typography styles moved to Typography.styles.body + inline styles
  },
  recommendationSubtitle: {
    // Typography styles moved to Typography.styles.caption
  },
  doneButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  doneButtonText: {
    // Typography styles moved to Typography.styles.buttonLarge
  },
});
