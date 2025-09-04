// components/morphing/settings/TextContentView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

interface TextContentViewProps {
  title: string;
  content: string;
  onBackPress: () => void;
  colors: any;
}

export function TextContentView({
  title,
  content,
  onBackPress,
  colors,
}: TextContentViewProps) {
  // Split content by double newlines to create paragraphs
  const paragraphs = content
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={onBackPress}
          size={36}
          iconSize={18}
          backgroundColor={colors.buttonBackground}
        />

        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            {title}
          </ThemedText>
        </View>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {paragraphs.map((paragraph, index) => (
          <ThemedText
            key={index}
            type="body"
            style={[styles.paragraph, { color: colors.text, lineHeight: 24 }]}
          >
            {paragraph}
          </ThemedText>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  paragraph: {
    marginBottom: 16,
    textAlign: "left",
  },
});
