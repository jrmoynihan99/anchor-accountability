import { CountUpNumber } from "@/components/onboarding/narrative/CountUpNumber";
import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function Problem1({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [countDone, setCountDone] = useState(false);

  return (
    <>
      <FadeInText delay={400}>
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            color: colors.textSecondary,
            marginBottom: 16,
          }}
        >
          Did you know...
        </ThemedText>
      </FadeInText>
      <CountUpNumber
        target={75}
        suffix="%"
        delay={800}
        onComplete={() => setCountDone(true)}
      />
      <FadeInText delay={400} ready={countDone} onComplete={onReady}>
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginTop: 16 }}
        >
          of Christian men admit to using pornography.
        </ThemedText>
      </FadeInText>
    </>
  );
}
