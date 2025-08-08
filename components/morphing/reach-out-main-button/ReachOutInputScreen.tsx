// ReachOutInputScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
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
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

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

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.textInputBackground,
                borderColor: colors.textInputBorder,
                color: colors.text,
              },
            ]}
            placeholder="(Optional) Share any context that might help others encourage you..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={contextMessage}
            onChangeText={onContextChange}
            maxLength={500}
          />
          <ThemedText
            type="small"
            style={[
              styles.characterCount,
              {
                color: colors.textMuted,
                textAlign: "right",
                marginTop: 8,
              },
            ]}
          >
            {contextMessage.length}/500
          </ThemedText>
        </View>

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

        {/* Anonymous Badge */}
        <View
          style={[
            styles.anonymousBadge,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
        >
          <IconSymbol
            name="eye.slash"
            size={14}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <ThemedText
            type="badge"
            style={[styles.anonymousBadgeText, { color: colors.textMuted }]}
          >
            100% anonymous
          </ThemedText>
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
  inputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 0,
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
  },
  characterCount: {
    // Typography styles moved to Typography.styles.small + inline styles
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
  anonymousBadge: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    alignSelf: "center",
  },
  anonymousBadgeText: {
    // Typography styles moved to Typography.styles.badge
  },
});
