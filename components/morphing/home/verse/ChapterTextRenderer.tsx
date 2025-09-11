// components/ChapterTextRenderer.tsx
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ChapterTextProps {
  chapterText: {
    schema: string;
    blocks: Block[];
  };
  colors: any;
  activeVerse?: string;
}

interface Block {
  type: "heading" | "subheading" | "para" | "poetry";
  text?: string;
  segments?: Segment[];
  lines?: PoetryLine[];
}

interface Segment {
  kind: "v" | "t";
  n?: number;
  text?: string;
}

interface PoetryLine {
  indent: number;
  segments: Segment[];
}

// Helper for robust matching
function normalizeForMatch(str?: string): string {
  if (!str) return "";
  return str
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();
}

export function ChapterTextRenderer({
  chapterText,
  colors,
  activeVerse,
}: ChapterTextProps) {
  if (!chapterText?.blocks) {
    return (
      <ThemedText type="body" style={{ color: colors.textSecondary }}>
        No chapter text available
      </ThemedText>
    );
  }

  const renderSegments = (segments: Segment[], isPoetry = false) => (
    <Text style={[styles.verseText, { color: colors.textSecondary }]}>
      {segments.map((segment, index) => {
        if (segment.kind === "v") {
          return (
            <Text
              key={`verse-${segment.n}-${index}`}
              style={[
                styles.verseNumber,
                { color: colors.secondaryButtonBackground },
                isPoetry && styles.poetryVerseNumber,
              ]}
            >
              {segment.n}{" "}
            </Text>
          );
        } else if (segment.kind === "t") {
          let isActive = false;
          if (!!activeVerse && !!segment.text) {
            const normalizedActiveVerse = normalizeForMatch(activeVerse);
            const normalizedSegment = normalizeForMatch(segment.text);
            isActive = normalizedActiveVerse.includes(normalizedSegment);
          }
          return (
            <Text
              key={`text-${index}`}
              style={{
                color: colors.textSecondary,
                fontWeight: isActive ? "bold" : "normal",
              }}
            >
              {segment.text}
            </Text>
          );
        }
        return null;
      })}
    </Text>
  );

  const renderBlock = (block: Block, blockIndex: number) => {
    switch (block.type) {
      case "heading":
        return (
          <ThemedText
            key={`heading-${blockIndex}`}
            type="title"
            style={[
              styles.headerText,
              {
                color: colors.secondaryButtonBackground,
                textAlign: "center",
              },
            ]}
          >
            {block.text}
          </ThemedText>
        );
      case "subheading":
        return (
          <ThemedText
            key={`subheading-${blockIndex}`}
            type="subtitle"
            style={[
              styles.subheaderText,
              {
                color: colors.secondaryButtonBackground,
                textAlign: "center",
              },
            ]}
          >
            {block.text}
          </ThemedText>
        );
      case "para":
        if (!block.segments) return null;
        return (
          <View key={`para-${blockIndex}`} style={styles.paragraphContainer}>
            {renderSegments(block.segments)}
          </View>
        );
      case "poetry":
        if (!block.lines) return null;
        return (
          <View key={`poetry-${blockIndex}`} style={styles.poetryContainer}>
            {block.lines.map((line, lineIndex) => (
              <View
                key={`poetry-line-${lineIndex}`}
                style={[styles.poetryLine, { marginLeft: line.indent * 20 }]}
              >
                {renderSegments(line.segments, true)}
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {chapterText.blocks.map((block, index) => renderBlock(block, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paragraphContainer: {
    marginBottom: 12,
  },
  poetryContainer: {
    marginBottom: 12,
  },
  poetryLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  verseNumber: {
    fontWeight: "bold",
    fontSize: 13,
    marginRight: 6,
    lineHeight: 22,
  },
  poetryVerseNumber: {
    fontSize: 12,
    marginRight: 4,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  headerText: {
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subheaderText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
});
