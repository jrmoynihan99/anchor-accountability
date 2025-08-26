// ReachOutInputScreen.tsx
import { MessageInput } from "@/components/MessageInput";
import { AnonymousBadge } from "@/components/morphing/anonymous-badge/AnonymousBadge";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ReachOutInputScreenProps {
  contextMessage: string;
  onContextChange: (text: string) => void;
  onSend: () => void;
}

export function ReachOutInputScreen({
  contextMessage,
  onContextChange,
  onSend,
}: ReachOutInputScreenProps) {
  const { colors } = useTheme();

  const handleSendPress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Call the original onSend function
    onSend();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Icon */}
        <View style={styles.modalHeader}>
          <Ionicons name="shield-checkmark" size={40} color={colors.text} />
          <ThemedText
            type="titleLarge"
            style={[
              styles.title,
              {
                color: colors.text,
                marginTop: 12,
                textAlign: "center",
              },
            ]}
          >
            Need Support?
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
          You're not alone in this journey. Reach out anonymously, and receive
          instant encouragement & accoutability from our community.
        </ThemedText>

        <MessageInput
          value={contextMessage}
          onChangeText={onContextChange}
          placeholder="(Optional) Share any context that might help others encourage you..."
          maxLength={500}
          minHeight={120}
        />

        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.text }]}
          onPress={handleSendPress}
        >
          <IconSymbol
            name="paperplane"
            size={20}
            color={colors.white}
            style={{ marginRight: 8 }}
          />
          <ThemedText
            type="buttonLarge"
            style={[styles.sendButtonText, { color: colors.white }]}
          >
            Send Request
          </ThemedText>
        </TouchableOpacity>

        {/* Anonymous Badge - Using the component */}
        <View style={{ marginTop: 12 }}>
          <AnonymousBadge />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 16,
  },
  title: {
    // Typography styles moved to Typography.styles.titleLarge + inline styles
  },
  description: {
    // Typography styles moved to Typography.styles.body + inline styles
  },
  sendButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  sendButtonText: {
    // Typography styles moved to Typography.styles.buttonLarge
  },
});
