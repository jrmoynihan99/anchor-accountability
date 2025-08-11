// components/IntroScrollableMessage.tsx
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";

export function IntroScrollableMessage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const messageText = [
    "Hi, I'm someone who struggled with porn addiction for years. I know the shame, the isolation, and the cycle that feels impossible to break.",
    "One thing that truly helped me was having accountability partners – people who understood the struggle and could offer support in moments of weakness. But I often stopped reaching out because the shame felt too overwhelming.",
    "That's why I built this app. It's a place for 100% anonymous accountability – where you can reach out anytime during moments of temptation and connect with real people who understand, without the shame or judgment.",
    "You don't have to face this alone. Recovery is possible, and it starts with our willingness to reach out for help.",
  ];

  return (
    <View style={styles.container}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <LinearGradient
            colors={["transparent", "black", "black", "transparent"]}
            locations={[0, 0.06, 0.9, 1]}
            style={styles.mask}
          />
        }
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <View style={styles.messageContainer}>
            {messageText.map((text, index) => (
              <ThemedText
                key={index}
                type="body"
                style={[styles.messageText, { color: colors.textSecondary }]}
              >
                {text}
              </ThemedText>
            ))}
          </View>
        </ScrollView>
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  maskedView: {
    flex: 1,
  },
  mask: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  messageContainer: {
    paddingHorizontal: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "left",
  },
});
