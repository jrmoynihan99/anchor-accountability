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
  // --- HANDLE INDENTED (POETRY) LINE ---
  if (line.startsWith("<<INDENT>>")) {
    return (
      <ThemedText
        type="body"
        style={[styles.indentedText, { color: colors.textSecondary }]}
      >
        {line.replace(/^<<INDENT>>\s?/, "")}
      </ThemedText>
    );
  }

  // --- MATCH VERSE NUMBER ---
  const match = line.match(/^(\d+)(\s+)(.*)$/);
  if (match) {
    const [, verseNumber, , text] = match;
    const isActive = text.trim() === activeVerse?.trim();

    return (
      <View style={styles.lineContainer}>
        <Text
          style={[
            styles.verseNumber,
            { color: colors.secondaryButtonBackground },
          ]}
        >
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
  }

  // --- HEADER DETECTION ---
  const isHeader = line.trim().length > 0 && !/^\d+\s/.test(line);
  if (isHeader) {
    return (
      <ThemedText
        type="title"
        style={[
          styles.headerText,
          { color: colors.secondaryButtonBackground, textAlign: "center" },
        ]}
      >
        {line.trim()}
      </ThemedText>
    );
  }

  // --- FALLBACK PARAGRAPH ---
  return (
    <ThemedText
      type="body"
      style={[styles.paragraphText, { color: colors.textSecondary }]}
    >
      {line.trim()}
    </ThemedText>
  );
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
  // --- HEADER STYLE ---
  headerText: {
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  paragraphText: {
    marginBottom: 10,
    fontSize: 16,
    lineHeight: 22,
  },
  // --- INDENTED/POETRY STYLE ---
  indentedText: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 24,
    marginBottom: 6,
  },
});
