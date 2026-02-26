import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function TheEnemy({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);

  return (
    <>
      <FadeInText delay={600} onComplete={() => setLine1Done(true)}>
        <ThemedText type="titleLarge" style={{ textAlign: "center" }}>
          Reaching out is scary.
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
          It's not the first thing we want to share about ourselves.
        </ThemedText>
      </FadeInText>
      <FadeInText delay={1500} ready={line2Done} onComplete={onReady}>
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginTop: 32 }}
        >
          And that's exactly how the enemy keeps us quiet.
        </ThemedText>
      </FadeInText>
    </>
  );
}
