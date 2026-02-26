import { FadeInText } from "@/components/onboarding/narrative/FadeInText";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

export function IntroAnchor({ onReady }: { onReady: () => void }) {
  const { colors } = useTheme();
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const [line3Done, setLine3Done] = useState(false);
  const [line4Done, setLine4Done] = useState(false);
  const [line5Done, setLine5Done] = useState(false);

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
        delay={1000}
        ready={line1Done}
        onComplete={() => setLine2Done(true)}
      >
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoCircle,
              {
                backgroundColor: colors.iconCircleSecondaryBackground,
                borderColor: `${colors.icon}33`,
              },
            ]}
          >
            <Image
              source={require("@/assets/images/splash-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
        <ThemedText
          type="titleXLarge"
          style={{ textAlign: "center", marginTop: 16 }}
        >
          Introducing Anchor.
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
            marginTop: 16,
            color: colors.textSecondary,
          }}
        >
          A completely anonymous space where you can reach out — and a real
          person who understands will be there.
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={2500}
        ready={line3Done}
        onComplete={() => setLine4Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", marginTop: 24 }}
        >
          Without the fear...
        </ThemedText>
      </FadeInText>
      <FadeInText
        delay={1000}
        ready={line4Done}
        onComplete={() => setLine5Done(true)}
      >
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", marginTop: 12 }}
        >
          Without the shame...
        </ThemedText>
      </FadeInText>
      <FadeInText delay={1000} ready={line5Done} onComplete={onReady}>
        <ThemedText
          type="bodyMedium"
          style={{ textAlign: "center", marginTop: 12 }}
        >
          Without the judgement.
        </ThemedText>
      </FadeInText>
    </>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 32,
  },
});
