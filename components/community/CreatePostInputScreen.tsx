import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { PostCategory } from "./CreatePostModal";

const CATEGORIES: { value: PostCategory; label: string; icon: string }[] = [
  { value: "testimonies", label: "Testimony", icon: "star" },
  { value: "resources", label: "Resource", icon: "book" },
  { value: "questions", label: "Question", icon: "questionmark.circle" },
  { value: "other", label: "Other", icon: "ellipsis.circle" },
];

const MAX_CONTENT_LENGTH = 1000;

export function CreatePostInputScreen({
  title,
  setTitle,
  content,
  setContent,
  selectedCategories,
  setSelectedCategories,
  creating,
  error,
  onSubmit,
}: {
  title: string;
  setTitle: (s: string) => void;
  content: string;
  setContent: (s: string) => void;
  selectedCategories: PostCategory[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<PostCategory[]>>;
  creating: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const { colors } = useTheme();
  const contentInputRef = useRef<TextInput>(null);

  const handleToggleCategory = (cat: PostCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handlePressSubmit = () => {
    Keyboard.dismiss();
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a title for your post.");
      return;
    }
    if (!content.trim()) {
      Alert.alert(
        "Content Required",
        "Please enter some content for your post."
      );
      return;
    }
    if (selectedCategories.length === 0) {
      Alert.alert("Category Required", "Please select at least one category.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit();
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.modalHeader}>
        <IconSymbol
          name="bubble.left.and.bubble.right"
          size={40}
          color={colors.tint}
        />
        <ThemedText
          type="titleLarge"
          style={{
            color: colors.text,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Make A Post
        </ThemedText>
        <ThemedText
          type="body"
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Share testimonies, resources, questions, or encouragement
        </ThemedText>
      </View>

      {/* Title Input */}
      <View style={styles.inputSection}>
        <ThemedText
          type="captionMedium"
          style={{ color: colors.textSecondary }}
        >
          TITLE
        </ThemedText>
        <TextInput
          style={[
            styles.titleInput,
            {
              color: colors.text,
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
          placeholder="Give your post a clear title..."
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          returnKeyType="next"
          onSubmitEditing={() => contentInputRef.current?.focus()}
        />
        <ThemedText
          type="caption"
          style={{
            color: colors.textSecondary,
            alignSelf: "flex-end",
            marginTop: 6,
            opacity: 0.6,
          }}
        >
          {title.length}/100
        </ThemedText>
      </View>

      {/* Content Input */}
      <View style={styles.inputSection}>
        <ThemedText
          type="captionMedium"
          style={{ color: colors.textSecondary }}
        >
          CONTENT
        </ThemedText>
        <TextInput
          ref={contentInputRef}
          style={[
            styles.contentInput,
            {
              color: colors.text,
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
          placeholder="Share your story, resource, question, or words of encouragement..."
          placeholderTextColor={colors.textSecondary}
          value={content}
          onChangeText={setContent}
          maxLength={MAX_CONTENT_LENGTH}
          multiline
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
        />
        <ThemedText
          type="caption"
          style={{
            color: colors.textSecondary,
            alignSelf: "flex-end",
            marginTop: 6,
            opacity: 0.6,
          }}
        >
          {content.length}/{MAX_CONTENT_LENGTH}
        </ThemedText>
      </View>

      {/* Category Selection */}
      <View style={styles.inputSection}>
        <ThemedText
          type="captionMedium"
          style={{ color: colors.textSecondary }}
        >
          CATEGORY (select all that apply)
        </ThemedText>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.value);
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selected
                      ? colors.tint
                      : colors.modalCardBackground,
                    borderColor: selected
                      ? colors.tint
                      : colors.modalCardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => handleToggleCategory(cat.value)}
                disabled={creating}
              >
                <IconSymbol
                  name={cat.icon as any}
                  size={18}
                  color={selected ? colors.white : colors.textSecondary}
                  style={styles.categoryIcon}
                />
                <ThemedText
                  type="captionMedium"
                  style={{
                    color: selected ? colors.white : colors.text,
                  }}
                >
                  {cat.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={16}
            color={colors.error}
          />
          <ThemedText
            type="caption"
            style={{ color: colors.error, marginLeft: 8, flex: 1 }}
          >
            {error}
          </ThemedText>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          {
            backgroundColor: colors.text,
            opacity: creating ? 0.6 : 1,
          },
        ]}
        onPress={handlePressSubmit}
        disabled={creating}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="paperplane"
          size={20}
          color={colors.white}
          style={styles.submitIcon}
        />
        <ThemedText type="buttonLarge" style={{ color: colors.white }}>
          {creating ? "Creating Post..." : "Share Post"}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 8, paddingTop: 42, paddingBottom: 32 },
  modalHeader: { alignItems: "center", marginTop: 20, marginBottom: 32 },
  inputSection: { marginBottom: 24 },
  titleInput: {
    minHeight: 48,
    fontSize: 17,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  contentInput: {
    minHeight: 120,
    maxHeight: 200,
    fontSize: 16,
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    textAlignVertical: "top",
  },

  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: "45%",
  },
  categoryIcon: { marginRight: 8 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  submitIcon: { marginRight: 8 },
});
