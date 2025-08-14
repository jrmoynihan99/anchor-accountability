// VerseView.tsx - Default verse display
import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface VerseViewProps {
  verse: string;
  reference: string | null;
  formattedDate: string;
  bibleVersion?: string;
  onReadInContext: () => void;
  colors: any;
}

export function VerseView({
  verse,
  reference,
  formattedDate,
  bibleVersion,
  onReadInContext,
  colors,
}: VerseViewProps) {
  return (
    <View style={styles.modalCard}>
      <ThemedText
        type="title"
        style={[styles.dateHeader, { color: colors.text, textAlign: "center" }]}
      >
        Verse of the Day – {formattedDate}
      </ThemedText>

      <ThemedText
        type="verseBody"
        style={[
          styles.modalVerseText,
          {
            color: colors.textSecondary,
            textAlign: "center",
          },
        ]}
      >
        {verse}
      </ThemedText>

      <View style={styles.modalReferenceContainer}>
        <ThemedText
          type="body"
          style={[
            styles.modalReference,
            {
              color: colors.textSecondary,
              textAlign: "center",
              opacity: 0.8,
            },
          ]}
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

      <TouchableOpacity
        style={[
          styles.contextButton,
          { backgroundColor: colors.buttonBackground },
        ]}
        onPress={onReadInContext}
      >
        <ThemedText
          type="buttonLarge"
          style={[styles.contextButtonText, { color: colors.white }]}
        >
          📖 Read in Context
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  modalCard: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dateHeader: {
    marginBottom: 32,
  },
  modalVerseText: {
    marginBottom: 24,
    paddingHorizontal: 0,
    maxWidth: "100%",
  },
  modalReferenceContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  modalReference: {},
  contextButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginHorizontal: 16,
  },
  contextButtonText: {},
});
