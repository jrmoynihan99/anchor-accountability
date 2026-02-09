// ReachOutConfirmationScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useModalIntent } from "@/context/ModalIntentContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ReachOutConfirmationScreenProps {
  onClose: () => void;
  crisis?: boolean;
}

interface RecommendedAction {
  icon: string;
  title: string;
  subtitle: string;
  action?: () => void;
}

export function ReachOutConfirmationScreen({
  onClose,
  crisis,
}: ReachOutConfirmationScreenProps) {
  const { colors, effectiveTheme } = useTheme();
  const { setModalIntent } = useModalIntent();

  // Main color for icons/titles based on theme
  const mainTextColor = effectiveTheme === "dark" ? colors.text : colors.text;

  const handleCallHotline = () => {
    Linking.openURL("tel:988");
  };

  const handleTextHotline = () => {
    Linking.openURL("sms:988");
  };

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

      {crisis && (
        <View
          style={[
            styles.crisisBanner,
            {
              backgroundColor: `${colors.error}15`,
              borderColor: colors.error,
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={20}
            color={colors.error}
            style={{ marginBottom: 8 }}
          />
          <ThemedText
            type="body"
            style={{
              color: mainTextColor,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            If you or someone you know is struggling, you are not alone. Please
            reach out to the 988 Suicide & Crisis Lifeline.
          </ThemedText>
          <View style={styles.crisisButtons}>
            <TouchableOpacity
              style={[styles.crisisButton, { backgroundColor: colors.error }]}
              onPress={handleCallHotline}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <ThemedText
                type="buttonLarge"
                style={{ color: "#fff", marginLeft: 6 }}
              >
                Call 988
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.crisisButton,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: colors.error,
                },
              ]}
              onPress={handleTextHotline}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={16} color={colors.error} />
              <ThemedText
                type="buttonLarge"
                style={{ color: colors.error, marginLeft: 6 }}
              >
                Text 988
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  crisisBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  crisisButtons: {
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
  crisisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
