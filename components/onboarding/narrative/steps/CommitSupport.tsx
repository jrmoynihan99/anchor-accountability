import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const ONBOARDING_NOTIFICATION_PROMPTED_KEY = "onboarding_notification_prompted_at";

export function CommitSupport({
  onCommit,
  onSkip,
}: {
  onCommit: () => void;
  onSkip: () => void;
}) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [line3Done, setLine3Done] = useState(false);
  const [line4Done, setLine4Done] = useState(false);
  const [line5Done, setLine5Done] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const markNotificationPrompted = async () => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_NOTIFICATION_PROMPTED_KEY,
        new Date().toISOString(),
      );
    } catch (error) {
      console.error("Error saving notification prompt timestamp:", error);
    }
  };

  const handleCommit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
    }
    await markNotificationPrompted();
    onCommit();
  };

  const handleNotNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markNotificationPrompted();
    onSkip();
  };

  return (
    <>
      <FadeInText delay={400} onComplete={() => setLine1Done(true)}>
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", color: colors.textSecondary }}
        >
          Last thing.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line1Done}
        onComplete={() => setLine2Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 20,
            color: colors.textSecondary,
          }}
        >
          This only works if people show up for each other.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line2Done}
        onComplete={() => setLine3Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 20,
            color: colors.textSecondary,
          }}
        >
          When someone reaches out —
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line3Done}
        onComplete={() => setLine4Done(true)}
      >
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 16 }}
        >
          Will you be there?
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line4Done}
        onComplete={() => setLine5Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 20,
            color: colors.textSecondary,
          }}
        >
          Your response could be the moment everything changes for someone.
        </ThemedText>
      </FadeInText>
      <FadeInText delay={400} ready={line5Done} style={styles.buttonArea}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.buttonBackground },
            ]}
            onPress={handleCommit}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <ThemedText type="buttonLarge" style={{ color: colors.white }}>
              {isLoading ? "Setting up..." : "I'll be there"}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleNotNow}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <ThemedText
              type="bodyMedium"
              style={{
                color: colors.textSecondary,
                textDecorationLine: "underline",
              }}
            >
              Not right now
            </ThemedText>
          </TouchableOpacity>
        </View>
      </FadeInText>
    </>
  );
}

const styles = StyleSheet.create({
  buttonArea: {
    marginTop: 48,
  },
  buttonContainer: {
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
});
