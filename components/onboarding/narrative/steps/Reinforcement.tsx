import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function Reinforcement({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);

  return (
    <>
      <FadeInText delay={400} onComplete={() => setLine1Done(true)}>
        <ThemedText type="titleXLarge" style={{ textAlign: "center" }}>
          Awesome.
        </ThemedText>
      </FadeInText>
      <FadeInText delay={600} ready={line1Done} onComplete={onReady}>
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 16,
            color: colors.textSecondary,
          }}
        >
          You just made the most important decision — not to fight this alone.
        </ThemedText>
      </FadeInText>
    </>
  );
}
