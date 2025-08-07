// ReachOutConfirmationScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ReachOutConfirmationScreenProps {
  onClose: () => void;
  onGuidedPrayer: () => void;
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
  const recommendedActions: RecommendedAction[] = [
    {
      icon: "book",
      title: "Read Scripture",
      subtitle: "Find peace in God's word",
    },
    { icon: "walk", title: "Take a Walk", subtitle: "Get some fresh air" },
    {
      icon: "heart",
      title: "Guided Prayer",
      subtitle: "Connect with God",
      action: onGuidedPrayer,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
      </View>

      <Text style={styles.title}>Message Sent!</Text>
      <Text style={styles.description}>
        Your anonymous request has been sent to the community. Sit tight -
        people will be responding with encouragement soon.
      </Text>

      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>While you wait:</Text>
        {recommendedActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recommendationCard}
            onPress={action.action}
            activeOpacity={0.7}
          >
            <View style={styles.recommendationIconContainer}>
              <Ionicons name={action.icon as any} size={24} color="#3A2D28" />
            </View>
            <View style={styles.recommendationText}>
              <Text style={styles.recommendationTitle}>{action.title}</Text>
              <Text style={styles.recommendationSubtitle}>
                {action.subtitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="rgba(58, 45, 40, 0.4)"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={onClose}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
  successIcon: {
    marginBottom: 24,
  },
  title: {
    color: "#3A2D28",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    color: "rgba(58, 45, 40, 0.8)",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  recommendationsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  recommendationsTitle: {
    color: "#3A2D28",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  recommendationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(58, 45, 40, 0.1)",
  },
  recommendationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(58, 45, 40, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  recommendationText: {
    flex: 1,
  },
  recommendationTitle: {
    color: "#3A2D28",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  recommendationSubtitle: {
    color: "rgba(58, 45, 40, 0.7)",
    fontSize: 14,
  },
  doneButton: {
    backgroundColor: "rgba(58, 45, 40, 0.1)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  doneButtonText: {
    color: "#3A2D28",
    fontSize: 16,
    fontWeight: "600",
  },
});
