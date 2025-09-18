// components/ContextView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ChapterTextRenderer } from "./ChapterTextRenderer";

// Define the structured chapter text type
interface StructuredChapterText {
  schema: string;
  blocks: any[];
}

interface ContextViewProps {
  reference: string | undefined;
  chapterText?: StructuredChapterText | string;
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
  const getPlaceholderChapterText = (): StructuredChapterText => {
    if (!verse) {
      return {
        schema: "v1",
        blocks: [
          {
            type: "para",
            segments: [{ kind: "t", text: "No chapter text available." }],
          },
        ],
      };
    }

    return {
      schema: "v1",
      blocks: [
        {
          type: "para",
          segments: [
            { kind: "v", n: 1 },
            { kind: "t", text: verse },
          ],
        },
        {
          type: "para",
          segments: [
            { kind: "t", text: "This is placeholder chapter content." },
          ],
        },
      ],
    };
  };

  // Check if chapterText is the new structured format or old string format
  const isStructuredFormat =
    chapterText && typeof chapterText === "object" && "blocks" in chapterText;

  // Type guard function to ensure we have the right type
  const getStructuredChapterText = (): StructuredChapterText => {
    if (isStructuredFormat) {
      return chapterText as StructuredChapterText;
    }
    // If it's a string, we could try to parse it, but for now use placeholder
    // You could add string parsing logic here if needed
    return getPlaceholderChapterText();
  };

  return (
    <View style={styles.contextContainer}>
      <View style={styles.contextHeader}>
        <BackButton
          onPress={onBackPress}
          size={36}
          iconSize={18}
          backgroundColor={colors.buttonBackground}
          iconColor={colors.white}
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

      <View style={[styles.contextScrollView, { flex: 1 }]}>
        <ChapterTextRenderer
          chapterText={getStructuredChapterText()}
          colors={colors}
          activeVerse={verse}
        />
      </View>
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
