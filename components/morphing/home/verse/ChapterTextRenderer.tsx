// components/ChapterTextRenderer.tsx
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { StyleSheet, View } from "react-native";
import { FlatList } from "react-native";

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
    // Inline text: use body/caption for default, but override for special cases
    <ThemedText
      type="body"
      style={{ color: colors.textSecondary, flexWrap: "wrap", flexShrink: 1 }}
    >
      {segments.map((segment, index) => {
        if (segment.kind === "v") {
          // Use ThemedText with "caption" for verse number (small, bold)
          return (
            <ThemedText
              key={`verse-${segment.n}-${index}`}
              type="caption"
              style={[
                {
                  color: colors.secondaryButtonBackground,
                  marginRight: isPoetry ? 4 : 6,
                  fontWeight: "bold",
                  fontSize: isPoetry ? 12 : 13,
                  lineHeight: 22,
                },
              ]}
            >
              {segment.n}{" "}
            </ThemedText>
          );
        } else if (segment.kind === "t") {
          let isActive = false;
          if (!!activeVerse && !!segment.text) {
            const normalizedActiveVerse = normalizeForMatch(activeVerse);
            const normalizedSegment = normalizeForMatch(segment.text);
            isActive = normalizedActiveVerse.includes(normalizedSegment);
          }
          // Use "body" type, and bold if active
          return (
            <ThemedText
              key={`text-${index}`}
              type="body"
              style={{
                color: colors.textSecondary,
                fontWeight: isActive ? "bold" : "normal",
              }}
            >
              {segment.text}
            </ThemedText>
          );
        }
        return null;
      })}
    </ThemedText>
  );

  const renderBlock = (block: Block, blockIndex: number) => {
    switch (block.type) {
      case "heading":
        return (
          <ThemedText
            key={`heading-${blockIndex}`}
            type="title"
            style={{
              color: colors.secondaryButtonBackground,
              textAlign: "center",
              marginTop: 18,
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            {block.text}
          </ThemedText>
        );
      case "subheading":
        return (
          <ThemedText
            key={`subheading-${blockIndex}`}
            type="subtitle"
            style={{
              color: colors.secondaryButtonBackground,
              textAlign: "center",
              marginTop: 14,
              marginBottom: 10,
              letterSpacing: 0.3,
            }}
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
    <FlatList
      data={chapterText.blocks}
      keyExtractor={(_, idx) => `block-${idx}`}
      renderItem={({ item, index }) => renderBlock(item, index)}
      // Optionally add padding/margin here, but DO NOT use flex: 1
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      windowSize={7}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      removeClippedSubviews={true}
    />
  );
}

const styles = StyleSheet.create({
  paragraphContainer: { marginBottom: 12 },
  poetryContainer: { marginBottom: 12 },
  poetryLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
});
