import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function WhatIfEasy({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [line3Done, setLine3Done] = useState(false);
  const [line4Done, setLine4Done] = useState(false);

  return (
    <>
      <FadeInText delay={600} onComplete={() => setLine1Done(true)}>
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", color: colors.textSecondary }}
        >
          But what if reaching out was easy?
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={800}
        ready={line1Done}
        onComplete={() => setLine2Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 16,
            color: colors.textSecondary,
          }}
        >
          What if there was a way to quickly get help
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
            marginTop: 12,
            color: colors.textSecondary,
          }}
        >
          ...as many times as you need
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={600}
        ready={line3Done}
        onComplete={() => setLine4Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{
            textAlign: "center",
            marginTop: 12,
            color: colors.textSecondary,
          }}
        >
          ...as often as you need
        </ThemedText>
      </FadeInText>
      <FadeInText delay={1000} ready={line4Done} onComplete={onReady}>
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 24 }}
        >
          Without anybody knowing who you are?
        </ThemedText>
      </FadeInText>
    </>
  );
}
