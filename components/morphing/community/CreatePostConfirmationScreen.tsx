import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";

interface CreatePostConfirmationScreenProps {
  crisis?: boolean;
}

export function CreatePostConfirmationScreen({
  crisis,
}: CreatePostConfirmationScreenProps) {
  const { colors } = useTheme();

  const handleCallHotline = () => {
    Linking.openURL("tel:988");
  };

  const handleTextHotline = () => {
    Linking.openURL("sms:988");
  };

  return (
    <View style={styles.container}>
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
        style={{ color: colors.text, marginTop: 20, textAlign: "center" }}
      >
        Post Created!
      </ThemedText>
      <ThemedText
        type="body"
        style={{
          color: colors.textSecondary,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Your post has been created!
      </ThemedText>

      {crisis && (
        <View
          style={[
            styles.crisisBanner,
            { backgroundColor: `${colors.error}15`, borderColor: colors.error },
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
              color: colors.text,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  crisisBanner: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
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
