import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function Closing({ onReady }: { onReady: () => void }) {
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
          Thanks so much for being here.
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
            marginTop: 16,
            color: colors.textSecondary,
          }}
        >
          God's cheering you on — and so are we.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line2Done}
        onComplete={() => setLine3Done(true)}
      >
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 32 }}
        >
          Let's beat this.
        </ThemedText>
      </FadeInText>
      <FadeInText delay={1000} ready={line3Done} onComplete={onReady}>
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 8 }}
        >
          Together.
        </ThemedText>
      </FadeInText>
    </>
  );
}
