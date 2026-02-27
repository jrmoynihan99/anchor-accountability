import { CountUpNumber } from "@/components/onboarding/narrative/CountUpNumber";
import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function Problem2({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [countDone, setCountDone] = useState(false);
  const [line1Done, setLine1Done] = useState(false);

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
          But despite that...
        </ThemedText>
      </FadeInText>
      <CountUpNumber
        target={84}
        suffix="%"
        delay={1200}
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
          say they've never once shared or asked for help.
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
          And are struggling in silence.
        </ThemedText>
      </FadeInText>
    </>
  );
}
