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
  text?: string; // for headings and subheadings
  segments?: Segment[]; // for paragraphs
  lines?: PoetryLine[]; // for poetry
}

interface Segment {
  kind: "v" | "t"; // verse number or text
  n?: number; // verse number
  text?: string; // text content
}

interface PoetryLine {
  indent: number;
  segments: Segment[];
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

  const renderSegments = (segments: Segment[], isPoetry = false) => {
    // For both paragraphs and poetry, we use nested Text components
    // The key is ensuring paragraph Text components flow inline

    let hasActiveVerse = false;

    // Check if any segment contains the active verse
    segments.forEach((segment) => {
      if (
        segment.kind === "t" &&
        segment.text?.trim() === activeVerse?.trim()
      ) {
        hasActiveVerse = true;
      }
    });

    return (
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
                {segment.n}
                {isPoetry ? "" : " "}
              </Text>
            );
          } else if (segment.kind === "t") {
            const isActive = segment.text?.trim() === activeVerse?.trim();
            return (
              <Text
                key={`text-${index}`}
                style={[
                  {
                    color: colors.textSecondary,
                    fontWeight: isActive ? "bold" : "normal",
                  },
                ]}
              >
                {segment.text}
              </Text>
            );
          }
          return null;
        })}
      </Text>
    );
  };

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
                style={[
                  styles.poetryLine,
                  { marginLeft: line.indent * 20 }, // 20px per indent level
                ]}
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
