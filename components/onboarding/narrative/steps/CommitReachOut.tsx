import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export function CommitReachOut({ onCommit }: { onCommit: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [line3Done, setLine3Done] = useState(false);
  const [line4Done, setLine4Done] = useState(false);
  const [line5Done, setLine5Done] = useState(false);

  const handleCommit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCommit();
  };

  return (
    <>
      <FadeInText delay={400} onComplete={() => setLine1Done(true)}>
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", color: colors.textSecondary }}
        >
          Will you make one commitment?
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
          When temptation hits —
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line2Done}
        onComplete={() => setLine3Done(true)}
      >
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 16 }}
        >
          Reach out.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line3Done}
        onComplete={() => setLine4Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 24,
            color: colors.textSecondary,
          }}
        >
          It's completely anonymous.
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
            marginTop: 12,
            color: colors.textSecondary,
          }}
        >
          And it changes everything.
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
          >
            <ThemedText type="buttonLarge" style={{ color: colors.white }}>
              I'll reach out
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
});
