import { useTheme } from "@/context/ThemeContext";
import { useVerseData } from "@/hooks/verse/useVerseData";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { VerseCardContent } from "./VerseCardContent";

interface VerseCardProps {
  offsetDays?: number;
  index?: number;
  currentIndex?: number;
  total?: number;
  buttonRef?: any;
  style?: any;
  onPress?: (
    verse: string | null,
    reference: string | null,
    formattedDate: string
  ) => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  preloadedData?: {
    verse: string | null;
    reference: string | null;
    prayerContent: string | null;
    formattedDate: string;
    loading: boolean;
  };
}

export function VerseCard({
  offsetDays = 0,
  index,
  currentIndex,
  total,
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
  preloadedData,
}: VerseCardProps) {
  const { colors } = useTheme();

  const fetchedData = useVerseData(preloadedData ? 0 : offsetDays);
  const verseData = preloadedData || fetchedData;

  return (
    <TouchableOpacity
      onPress={() =>
        onPress?.(verseData.verse, verseData.reference, verseData.formattedDate)
      }
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={{ flex: 1 }}
    >
      <Animated.View
        ref={buttonRef}
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          },
          style,
        ]}
      >
        <VerseCardContent
          verse={verseData.verse}
          reference={verseData.reference}
          formattedDate={verseData.formattedDate}
          loading={verseData.loading}
          index={index}
          currentIndex={currentIndex}
          total={total}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 20,
    marginTop: 24,
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
    minHeight: 255, // Ensures consistent minimum height for all cards
  },
});
