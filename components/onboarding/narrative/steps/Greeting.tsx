import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";

export function Greeting({ onReady }: { onReady: () => void }) {
  return (
    <FadeInText delay={600} onComplete={onReady}>
      <ThemedText type="titleXLarge" style={{ textAlign: "center" }}>
        Hey.
      </ThemedText>
    </FadeInText>
  );
}
