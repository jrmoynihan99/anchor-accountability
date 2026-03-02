// components/messages/PleaResponseConfirmationScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface PleaResponseConfirmationScreenProps {
  onClose: () => void;
}

export function PleaResponseConfirmationScreen({
  onClose,
}: PleaResponseConfirmationScreenProps) {
  const { colors } = useTheme();

  const handleDonePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${colors.iconCircleBackground}50` },
          ]}
        >
          <IconSymbol name="checkmark" size={36} color={colors.icon} />
        </View>
        <ThemedText
          type="title"
          style={[styles.text, { color: colors.text, marginTop: 20 }]}
        >
          Thank you for helping!
        </ThemedText>
        <ThemedText
          type="body"
          style={[
            styles.subtext,
            { color: colors.textSecondary, marginTop: 8 },
          ]}
        >
          Your encouragement was sent anonymously.
        </ThemedText>

        <View
          style={[
            styles.prayerCard,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={20}
            color={colors.textSecondary}
            style={{ marginBottom: 8 }}
          />
          <ThemedText
            type="body"
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Consider taking a moment to pray for this person and their struggle.
          </ThemedText>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 22,
  },
  subtext: {
    textAlign: "center",
    opacity: 0.8,
    fontSize: 16,
    marginBottom: 20,
  },
  prayerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  doneButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
