// components/ContextView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { VerseParagraph } from "./VerseParagraph";

interface ContextViewProps {
  reference: string | undefined;
  chapterText?: string;
  verse: string;
  bibleVersion?: string;
  onBackPress: () => void;
  colors: any;
}

export function ContextView({
  reference,
  chapterText,
  verse,
  bibleVersion,
  onBackPress,
  colors,
}: ContextViewProps) {
  const getPlaceholderChapterText = () => {
    if (!verse) return "";
    return `1 ${verse}\n\nThis is placeholder chapter content.`;
  };

  console.log("👉 reference:", reference);
  console.log("👉 verse:", verse);

  const rawText = (chapterText || getPlaceholderChapterText()).replace(
    /\\n/g,
    "\n"
  );

  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <View style={styles.contextContainer}>
      <View style={styles.contextHeader}>
        <BackButton
          onPress={onBackPress}
          size={36}
          iconSize={18}
          backgroundColor={colors.buttonBackground}
        />

        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            type="title"
            style={[styles.contextTitle, { color: colors.text }]}
          >
            {reference}
          </ThemedText>
          {!!bibleVersion && (
            <ThemedText
              type="caption"
              style={{ color: colors.textSecondary, fontStyle: "italic" }}
            >
              {bibleVersion}
            </ThemedText>
          )}
        </View>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.contextScrollView}
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line, index) => (
          <VerseParagraph
            key={index}
            line={line}
            colors={colors}
            activeVerse={verse}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contextContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -16,
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  contextTitle: {
    textAlign: "center",
  },
  contextScrollView: {
    flex: 1,
  },
});
