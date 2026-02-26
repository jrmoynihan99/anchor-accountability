import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function TheExperience({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [line3Done, setLine3Done] = useState(false);

  return (
    <>
      <FadeInText delay={600} onComplete={() => setLine1Done(true)}>
        <ThemedText type="titleLarge" style={{ textAlign: "center" }}>
          Connect with real people.
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
          People who understand the struggle. People who have been there.
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
          Build trust and accountability with safety...
        </ThemedText>
      </FadeInText>
      <FadeInText delay={1000} ready={line3Done} onComplete={onReady}>
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 32 }}
        >
          And move toward lasting freedom from lust.
        </ThemedText>
      </FadeInText>
    </>
  );
}
