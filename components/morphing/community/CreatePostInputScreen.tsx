import { MessageInput } from "@/components/MessageInput";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
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

  // Check if button should be disabled - same logic as other components
  const isButtonDisabled =
    !title.trim() ||
    !content.trim() ||
    selectedCategories.length === 0 ||
    creating;

  // Get button colors - same logic as PleaResponseInputScreen
  const getButtonBackgroundColor = () => {
    if (isButtonDisabled) {
      return `${colors.buttonBackground}90`; // 25% opacity for muted effect
    }
    return colors.buttonBackground;
  };

  const getButtonTextColor = () => {
    if (isButtonDisabled) {
      return `${colors.white}90`; // Slightly muted white text
    }
    return colors.white;
  };

  const handleButtonPress = () => {
    if (isButtonDisabled) {
      // Show appropriate popup based on what's missing
      if (!title.trim()) {
        Alert.alert("Title Required", "Please enter a title for your post.");
      } else if (!content.trim()) {
        Alert.alert(
          "Content Required",
          "Please enter some content for your post."
        );
      } else if (selectedCategories.length === 0) {
        Alert.alert(
          "Category Required",
          "Please select at least one category."
        );
      }
      return;
    }

    handlePressSubmit();
  };

  const getButtonText = () => {
    if (creating) return "Creating Post...";
    if (isButtonDisabled) return "Complete your post";
    return "Share Post";
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* Header */}
      <View style={styles.modalHeader}>
        <IconSymbol
          name="bubble.left.and.bubble.right.fill"
          size={40}
          color={colors.icon}
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

      {/* Title Input - Using MessageInput */}
      <View style={styles.inputSection}>
        <ThemedText
          type="captionMedium"
          style={{ color: colors.textSecondary, marginBottom: 8 }}
        >
          TITLE
        </ThemedText>
        <MessageInput
          value={title}
          onChangeText={setTitle}
          placeholder="Give your post a clear title..."
          maxLength={100}
          minHeight={48}
          showCharacterCount={true}
          showBorder={false}
        />
      </View>

      {/* Content Input - Using MessageInput */}
      <View style={styles.inputSection}>
        <ThemedText
          type="captionMedium"
          style={{ color: colors.textSecondary, marginBottom: 8 }}
        >
          CONTENT
        </ThemedText>
        <MessageInput
          value={content}
          onChangeText={setContent}
          placeholder="Share your story, resource, question, or words of encouragement..."
          maxLength={MAX_CONTENT_LENGTH}
          minHeight={80}
          showCharacterCount={true}
          showBorder={false}
        />
      </View>

      {/* Category Selection */}
      <View style={styles.inputSection}>
        <ThemedText
          type="captionMedium"
          style={{ color: colors.textSecondary, marginBottom: 8 }}
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
                      : colors.textInputBackground,
                    borderColor: selected
                      ? colors.tint
                      : colors.textInputBackground,
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

      {/* Submit Button - Updated with same logic as other components */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          {
            backgroundColor: getButtonBackgroundColor(),
          },
        ]}
        onPress={handleButtonPress}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="paperplane"
          size={20}
          color={getButtonTextColor()}
          style={styles.submitIcon}
        />
        <ThemedText type="buttonLarge" style={{ color: getButtonTextColor() }}>
          {getButtonText()}
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
    marginTop: 24,
  },
  submitIcon: { marginRight: 8 },
});
