// ✅ VerseModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BaseModal } from "../../BaseModal";
import { ContextView } from "./ContextView";
import { VerseCardContent } from "./VerseCardContent";
import { VerseView } from "./VerseView";
import { SharedValue } from "react-native-reanimated";

type ModalView = "verse" | "context";

interface VerseModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  verse: string | null;
  reference: string | null;
  formattedDate: string;
  index?: number;
  currentIndex?: number;
  total?: number;
  chapterText?: string;
  chapterReference?: string;
  bibleVersion?: string;
  initialView?: ModalView;
}

export function VerseModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  verse,
  reference,
  formattedDate,
  index,
  currentIndex,
  total,
  chapterText,
  chapterReference,
  bibleVersion,
  initialView = "verse",
}: VerseModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const [currentView, setCurrentView] = useState<ModalView>(initialView);

  useEffect(() => {
    if (isVisible) {
      setCurrentView(initialView);
    }
  }, [isVisible, initialView]);

  const handleReadInContext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentView("context");
  };

  const handleBackToVerse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentView("verse");
  };

  const buttonContent = (
    <VerseCardContent
      verse={verse}
      reference={reference}
      formattedDate={formattedDate}
      loading={false}
      showCarouselDots={true}
      index={index}
      currentIndex={currentIndex}
      total={total}
    />
  );

  const modalContent = (
    <View style={styles.modalContainer}>
      {!verse ? (
        <View style={styles.noContentContainer}>
          <ThemedText
            type="body"
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              opacity: 0.6,
            }}
          >
            No content available for {formattedDate}
          </ThemedText>
        </View>
      ) : currentView === "context" ? (
        <ContextView
          reference={chapterReference}
          chapterText={chapterText}
          verse={verse}
          bibleVersion={bibleVersion}
          onBackPress={handleBackToVerse}
          colors={colors}
        />
      ) : (
        <VerseView
          verse={verse}
          reference={reference}
          formattedDate={formattedDate}
          bibleVersion={bibleVersion}
          onReadInContext={handleReadInContext}
          colors={colors}
        />
      )}
    </View>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.15]}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    marginTop: 12,
  },
  noContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
});
