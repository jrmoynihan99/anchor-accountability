import { BaseModal } from "@/components/morphing/BaseModal";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useCreatePost } from "@/hooks/useCreatePost";
import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { CreatePostConfirmationScreen } from "./CreatePostConfirmationScreen";
import { CreatePostInputScreen } from "./CreatePostInputScreen";

export type PostCategory = "testimonies" | "resources" | "questions" | "other";

type ScreenType = "input" | "confirmation";

interface CreatePostModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function CreatePostModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: CreatePostModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const { createPost, creating, error } = useCreatePost();

  // Screen logic
  const [screen, setScreen] = useState<ScreenType>("input");
  const screenTransition = useSharedValue(0); // 0=input, 1=confirmation

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<PostCategory[]>(
    []
  );

  // Reset state when closed
  useEffect(() => {
    if (!isVisible) {
      setTimeout(() => {
        setScreen("input");
        screenTransition.value = 0;
        setTitle("");
        setContent("");
        setSelectedCategories([]);
      }, 200);
    }
  }, [isVisible, screenTransition]);

  // Slide screens
  const inputScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          screenTransition.value,
          [0, 1],
          [0, -100],
          "clamp"
        ),
      },
    ],
    opacity: interpolate(
      screenTransition.value,
      [0, 0.8, 1],
      [1, 0.3, 0],
      "clamp"
    ),
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }));
  const confirmationScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          screenTransition.value,
          [0, 1],
          [100, 0],
          "clamp"
        ),
      },
    ],
    opacity: interpolate(
      screenTransition.value,
      [0, 0.2, 1],
      [0, 1, 1],
      "clamp"
    ),
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }));

  // Auto-close after confirmation
  const showConfirmation = () => {
    screenTransition.value = withTiming(1, { duration: 320 });
    setScreen("confirmation");
    setTimeout(() => {
      close?.();
    }, 3000);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (creating) return;
    const postId = await createPost({
      title,
      content,
      categories: selectedCategories,
    });
    if (postId) {
      showConfirmation();
      setTitle("");
      setContent("");
      setSelectedCategories([]);
    }
  };

  // Confirm before discarding post if input
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
              close();
            },
          },
        ]
      );
    } else {
      close();
    }
  };

  // FAB content (plus icon)
  const buttonContent = (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <IconSymbol name="plus" size={28} color={colors.white} />
    </View>
  );

  // Layered screens
  const modalContent = (
    <View style={{ flex: 1, minHeight: 420 }}>
      {/* Input screen */}
      <Animated.View style={inputScreenStyle}>
        <CreatePostInputScreen
          title={title}
          setTitle={setTitle}
          content={content}
          setContent={setContent}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          creating={creating}
          error={error}
          onSubmit={handleSubmit}
        />
      </Animated.View>
      {/* Confirmation */}
      <Animated.View style={confirmationScreenStyle}>
        <CreatePostConfirmationScreen />
      </Animated.View>
    </View>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={handleClose}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.buttonBackground}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.15]}
      buttonContentPadding={0}
      buttonBorderRadius={28}
    >
      {modalContent}
    </BaseModal>
  );
}
