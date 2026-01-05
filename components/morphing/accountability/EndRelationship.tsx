// components/morphing/accountability/EndRelationship.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

interface EndRelationshipProps {
  relationshipId: string;
  role: "mentor" | "mentee";
  colors: any;
  onMessage: () => void;
  onComplete: () => void; // Called after successfully ending relationship
}

export function EndRelationship({
  relationshipId,
  role,
  colors,
  onMessage,
  onComplete,
}: EndRelationshipProps) {
  const { endRelationship } = useAccountability();

  const handleEndRelationship = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isMentor = role === "mentor";

    const title = "End Accountability Partnership?";
    const message = isMentor
      ? "Are you sure you want to end your accountability partnership? Please consider messaging them to let them know you're no longer able to support them. If possible, help them understand why so they aren't left feeling alone or abandoned in their recovery journey."
      : "Are you sure you want to end your accountability partnership? Please consider messaging your Anchor Partner to let them know. A brief explanation can help provide closure and maintain the trust you've built together.";

    Alert.alert(title, message, [
      {
        text: "Message First",
        onPress: onMessage,
        style: "default",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "End Partnership",
        onPress: async () => {
          try {
            await endRelationship(relationshipId);
            onComplete();
          } catch (error) {
            Alert.alert(
              "Error",
              "Failed to end partnership. Please try again."
            );
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.error || "#FF3B30" }]}
        onPress={handleEndRelationship}
        activeOpacity={0.8}
      >
        <IconSymbol name="person.fill.xmark" size={20} color={colors.white} />
        <ThemedText
          type="bodyMedium"
          lightColor={colors.white}
          darkColor={colors.white}
        >
          End Partnership
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
});
