// components/community/CreatePostModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useCreatePost } from "@/hooks/useCreatePost";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCategory } from "./types";

interface CreatePostModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: PostCategory; label: string; icon: string }[] = [
  { value: "testimonies", label: "Testimony", icon: "star" },
  { value: "resources", label: "Resource", icon: "book" },
  { value: "questions", label: "Question", icon: "questionmark.circle" },
  { value: "other", label: "Other", icon: "ellipsis.circle" },
];

const MAX_CONTENT_LENGTH = 1000;

export function CreatePostModal({ isVisible, onClose }: CreatePostModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { createPost, creating, error } = useCreatePost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<PostCategory[]>(
    []
  );

  const contentInputRef = useRef<TextInput>(null);

  const handleToggleCategory = (category: PostCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  };

  const handleSubmit = async () => {
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

    const postId = await createPost({
      title,
      content,
      categories: selectedCategories,
    });

    if (postId) {
      // Success
      Alert.alert(
        "Post Created!",
        "Your post has been submitted and will appear once approved.",
        [{ text: "OK", onPress: onClose }]
      );
      setTitle("");
      setContent("");
      setSelectedCategories([]);
    } else if (error) {
      Alert.alert("Error", error);
    }
  };

  const handleClose = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        "Discard Post?",
        "Are you sure you want to discard this post?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setTitle("");
              setContent("");
              setSelectedCategories([]);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                paddingTop: insets.top + 20,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <ThemedText type="body" style={{ color: colors.textSecondary }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
              New Post
            </ThemedText>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={creating}
              style={[
                styles.headerButton,
                creating && styles.headerButtonDisabled,
              ]}
            >
              <ThemedText
                type="bodyMedium"
                style={{ color: creating ? colors.textSecondary : colors.tint }}
              >
                {creating ? "Posting..." : "Post"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 36 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <ThemedText
                type="captionMedium"
                style={[styles.label, { color: colors.textSecondary }]}
              >
                TITLE
              </ThemedText>
              <TextInput
                style={[
                  styles.titleInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Give your post a title..."
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                multiline={false}
                returnKeyType="next"
                onSubmitEditing={() => contentInputRef.current?.focus()}
              />
              <ThemedText
                type="caption"
                style={[styles.charCount, { color: colors.textSecondary }]}
              >
                {title.length}/100
              </ThemedText>
            </View>

            {/* Content Input */}
            <View style={styles.inputGroup}>
              <ThemedText
                type="captionMedium"
                style={[styles.label, { color: colors.textSecondary }]}
              >
                CONTENT
              </ThemedText>
              <TextInput
                ref={contentInputRef}
                style={[
                  styles.contentInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="What's on your mind? (Share support, encouragement, resources...)"
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={setContent}
                maxLength={MAX_CONTENT_LENGTH}
                multiline
                textAlignVertical="top"
                autoCorrect
                autoCapitalize="sentences"
                blurOnSubmit={false}
                numberOfLines={6}
              />
              <ThemedText
                type="caption"
                style={[styles.charCount, { color: colors.textSecondary }]}
              >
                {content.length}/{MAX_CONTENT_LENGTH}
              </ThemedText>
            </View>

            {/* Category Select */}
            <View style={styles.inputGroup}>
              <ThemedText
                type="captionMedium"
                style={[styles.label, { color: colors.textSecondary }]}
              >
                CATEGORY
              </ThemedText>
              <View style={styles.categoriesRow}>
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
                            : colors.inputBackground,
                          borderColor: selected ? colors.tint : colors.border,
                        },
                      ]}
                      activeOpacity={0.82}
                      onPress={() => handleToggleCategory(cat.value)}
                      disabled={creating}
                    >
                      <IconSymbol
                        name={cat.icon}
                        size={15}
                        color={selected ? colors.white : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <ThemedText
                        type="captionMedium"
                        style={{
                          color: selected ? colors.white : colors.text,
                          fontWeight: selected ? "700" : "500",
                        }}
                      >
                        {cat.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Error (if any) */}
            {error ? (
              <View style={styles.errorContainer}>
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={16}
                  color={colors.error}
                />
                <ThemedText
                  type="caption"
                  style={{ color: colors.error, marginLeft: 6 }}
                >
                  {error}
                </ThemedText>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    minHeight: 62,
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    letterSpacing: 0.4,
    fontWeight: "700",
  },
  titleInput: {
    minHeight: 42,
    fontSize: 17,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontWeight: "600",
  },
  contentInput: {
    minHeight: 120,
    maxHeight: 250,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    fontWeight: "500",
  },
  charCount: {
    alignSelf: "flex-end",
    marginTop: 4,
    opacity: 0.5,
    fontSize: 12,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
