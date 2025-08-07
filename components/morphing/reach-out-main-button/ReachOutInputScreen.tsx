// ReachOutInputScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
  const mainTextColor = "#3A2D28";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Icon */}
        <View style={styles.modalHeader}>
          <Ionicons name="shield-checkmark" size={40} color={mainTextColor} />
          <Text style={[styles.title, { color: mainTextColor }]}>
            Need Support?
          </Text>
        </View>

        <Text style={styles.description}>
          You're not alone in this journey. Reach out anonymously, and receive
          instant encouragement & accoutability from our community.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="(Optional) Share any context that might help others encourage you..."
            placeholderTextColor="rgba(58, 45, 40, 0.5)"
            multiline
            value={contextMessage}
            onChangeText={onContextChange}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{contextMessage.length}/500</Text>
        </View>

        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Ionicons
            name="paper-plane"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.sendButtonText}>Send Request</Text>
        </TouchableOpacity>

        {/* Anonymous Badge */}
        <View style={styles.anonymousBadge}>
          <Ionicons
            name="eye-off"
            size={14}
            color="rgba(58, 45, 40, 0.6)"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.anonymousBadgeText}>100% anonymous</Text>
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
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  description: {
    color: "rgba(58, 45, 40, 0.8)",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 0,
  },
  inputLabel: {
    color: "#3A2D28",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#3A2D28",
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(58, 45, 40, 0.1)",
  },
  characterCount: {
    color: "rgba(58, 45, 40, 0.6)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  sendButton: {
    backgroundColor: "#3A2D28",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  anonymousBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    alignSelf: "center",
  },
  anonymousBadgeText: {
    color: "rgba(58, 45, 40, 0.6)",
    fontSize: 13,
    fontWeight: "500",
  },
});
