import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { OnboardingScreen } from "@/components/onboarding/narrative/OnboardingScreen";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useOnboardingContext } from "./_layout";

export default function CommunityScreen() {
  const { colors } = useTheme();
  const { deferredOrgName } = useOnboardingContext();
  const [showDescription, setShowDescription] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  const handleJoinOrg = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/onboarding/login",
      params: { fromCommunity: "true" },
    });
  };

  const handleJoinPublic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/onboarding/login",
      params: { organizationId: "public", organizationName: "Guest" },
    });
  };

  return (
    <OnboardingScreen showNextButton={false}>
      <FadeInText delay={400} onComplete={() => setShowDescription(true)}>
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", color: colors.textSecondary }}
        >
          Looks like you're joining
        </ThemedText>
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 8 }}
        >
          {deferredOrgName}
        </ThemedText>
      </FadeInText>

      {showDescription && (
        <FadeInText delay={400} onComplete={() => setShowButtons(true)}>
          <ThemedText
            type="bodyMedium"
            style={{
              textAlign: "center",
              marginTop: 24,
              color: colors.textSecondary,
            }}
          >
            You'll only interact with members of this community. Your anonymity
            remains completely intact.
          </ThemedText>
        </FadeInText>
      )}

      {showButtons && (
        <FadeInText delay={300} style={styles.buttonArea}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.buttonBackground },
              ]}
              onPress={handleJoinOrg}
              activeOpacity={0.8}
            >
              <ThemedText type="buttonLarge" style={{ color: colors.white }}>
                Yes, join {deferredOrgName}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleJoinPublic}
              activeOpacity={0.7}
            >
              <ThemedText
                type="bodyMedium"
                style={{
                  color: colors.textSecondary,
                  textDecorationLine: "underline",
                }}
              >
                No, join the open community
              </ThemedText>
            </TouchableOpacity>
          </View>
        </FadeInText>
      )}
    </OnboardingScreen>
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
    paddingHorizontal: 32,
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
