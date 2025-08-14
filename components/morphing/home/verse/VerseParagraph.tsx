// components/VerseParagraph.tsx
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface VerseParagraphProps {
  line: string;
  colors: any;
  activeVerse?: string;
}

export function VerseParagraph({
  line,
  colors,
  activeVerse,
}: VerseParagraphProps) {
  // Match lines that start with a verse number (e.g., "17 Therefore...")
  const match = line.match(/^(\d+)(\s+)(.*)$/);

  if (match) {
    const [, verseNumber, , text] = match;
    const isActive = text.trim() === activeVerse?.trim();

    return (
      <View style={styles.lineContainer}>
        <Text style={[styles.verseNumber, { color: colors.tint }]}>
          {verseNumber}
        </Text>
        <ThemedText
          type="body"
          style={[
            styles.verseText,
            {
              color: colors.textSecondary,
              fontWeight: isActive ? "bold" : "normal",
            },
          ]}
        >
          {text.trim()}
        </ThemedText>
      </View>
    );
  } else {
    // Fallback for non-verse-numbered lines
    return (
      <ThemedText
        type="body"
        style={[styles.paragraphText, { color: colors.textSecondary }]}
      >
        {line.trim()}
      </ThemedText>
    );
  }
}

const styles = StyleSheet.create({
  lineContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  verseNumber: {
    fontWeight: "bold",
    fontSize: 13,
    marginRight: 6,
    lineHeight: 20,
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  paragraphText: {
    marginBottom: 10,
    fontSize: 16,
    lineHeight: 22,
  },
});
