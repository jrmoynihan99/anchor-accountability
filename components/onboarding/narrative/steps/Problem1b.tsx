import { CountUpNumber } from "@/components/onboarding/narrative/CountUpNumber";
import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function Problem1b({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [countDone, setCountDone] = useState(false);
  const [line1Done, setLine1Done] = useState(false);

  return (
    <>
      <CountUpNumber
        target={40}
        suffix="%"
        onComplete={() => setCountDone(true)}
      />
      <FadeInText
        delay={400}
        ready={countDone}
        onComplete={() => setLine1Done(true)}
      >
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginTop: 16 }}
        >
          of Christian women admit the same.
        </ThemedText>
      </FadeInText>
      <FadeInText delay={600} ready={line1Done} onComplete={onReady}>
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 12,
            color: colors.textSecondary,
          }}
        >
          And that's just those who were brave enough to say yes.
        </ThemedText>
      </FadeInText>
    </>
  );
}
