import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function TheWeight({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);

  return (
    <>
      <FadeInText
        delay={400}
        duration={1000}
        onComplete={() => setLine1Done(true)}
      >
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", color: colors.textSecondary }}
        >
          The silence continues.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={400}
        duration={1000}
        ready={line1Done}
        onComplete={() => setLine2Done(true)}
      >
        <ThemedText
          type="titleLarge"
          style={{
            textAlign: "center",
            marginTop: 20,
            color: colors.textSecondary,
          }}
        >
          The shame grows.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={400}
        duration={1000}
        ready={line2Done}
        onComplete={onReady}
      >
        <ThemedText
          type="titleLarge"
          style={{
            textAlign: "center",
            marginTop: 20,
            color: colors.textSecondary,
          }}
        >
          And the cycle repeats.
        </ThemedText>
      </FadeInText>
    </>
  );
}
