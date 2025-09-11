// VerseView.tsx - ScrollView with dynamic centering
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

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
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
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
        activeOpacity={0.85}
      >
        <IconSymbol
          name="book"
          size={18}
          color={colors.white}
          style={{ marginRight: 8 }}
        />
        <ThemedText type="buttonLarge" style={{ color: colors.white }}>
          Read in Context
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
    justifyContent: "center", // Centers content when it's short
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
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    alignSelf: "stretch",
    minWidth: 200,
    maxWidth: 420,
  },
});
