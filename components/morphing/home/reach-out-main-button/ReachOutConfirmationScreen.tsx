// ReachOutConfirmationScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useModalIntent } from "@/context/ModalIntentContext";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface ReachOutConfirmationScreenProps {
  onClose: () => void;
}

interface RecommendedAction {
  icon: string;
  title: string;
  subtitle: string;
  action?: () => void;
}

export function ReachOutConfirmationScreen({
  onClose,
}: ReachOutConfirmationScreenProps) {
  const { colors, effectiveTheme } = useTheme();
  const { setModalIntent } = useModalIntent();

  // Main color for icons/titles based on theme
  const mainTextColor = effectiveTheme === "dark" ? colors.text : colors.text;

  // Handler for "Read Scripture"
  const handleReadScripture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalIntent("verse");
    router.push("/(tabs)");
    onClose?.();
  };

  // Handler for "Guided Prayer"
  const handleGuidedPrayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalIntent("guidedPrayer");
    router.push("/(tabs)");
    onClose?.();
  };

  const recommendedActions: RecommendedAction[] = [
    {
      icon: "book",
      title: "Read Scripture",
      subtitle: "Find peace in God's word",
      action: handleReadScripture,
    },
    {
      icon: "heart",
      title: "Guided Prayer",
      subtitle: "Connect with God",
      action: handleGuidedPrayer,
    },
    {
      icon: "walk",
      title: "Take a Walk",
      subtitle: "Get some fresh air",
      // No action property = non-interactive
    },
  ];

  const handleDonePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          style={{
            color: mainTextColor,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Message Sent!
        </ThemedText>
      </View>

      <ThemedText
        type="body"
        style={{
          color: mainTextColor,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Your anonymous request has been sent to the community. Sit tight –
        people will be responding with encouragement soon.
      </ThemedText>

      <View style={styles.recommendationsContainer}>
        <ThemedText
          type="captionMedium"
          style={{
            color: mainTextColor,
            marginBottom: 16,
            textAlign: "center",
          }}
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
                    style={{
                      color: mainTextColor,
                      marginBottom: 2,
                    }}
                  >
                    {action.title}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textSecondary,
                    }}
                  >
                    {action.subtitle}
                  </ThemedText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
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
                    style={{
                      color: mainTextColor,
                      marginBottom: 2,
                    }}
                  >
                    {action.title}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textMuted,
                    }}
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
        style={[
          styles.doneButton,
          { backgroundColor: colors.secondaryButtonBackground },
        ]}
        onPress={handleDonePress}
      >
        <ThemedText type="buttonLarge" style={{ color: colors.background }}>
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
  recommendationsContainer: {
    width: "100%",
    marginBottom: 12,
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
  doneButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
});
