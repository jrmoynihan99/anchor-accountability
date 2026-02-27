import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function HowItWorks({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [line3Done, setLine3Done] = useState(false);

  return (
    <>
      <FadeInText delay={400} onComplete={() => setLine1Done(true)}>
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", color: colors.textSecondary }}
        >
          When you need someone, you send an anonymous message.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line1Done}
        onComplete={() => setLine2Done(true)}
      >
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginTop: 24 }}
        >
          Every person on Anchor gets notified.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line2Done}
        onComplete={() => setLine3Done(true)}
      >
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginTop: 20 }}
        >
          Real people who understand...
        </ThemedText>
      </FadeInText>
      <FadeInText delay={1000} ready={line3Done} onComplete={onReady}>
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginTop: 12 }}
        >
          Ready to show up for you.
        </ThemedText>
      </FadeInText>
    </>
  );
}
