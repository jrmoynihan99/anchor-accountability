import { useVerseData } from "@/hooks/useVerseData";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";
import { ButtonModalTransitionBridge } from "../../ButtonModalTransitionBridge";
import { VerseCard } from "./VerseCard";
import { VerseModal } from "./VerseModal";

const screenWidth = Dimensions.get("window").width;

// Define the ref interface
export interface VerseCarouselRef {
  openTodayInContext: () => void;
}

// 🔧 Store both morph + originless controls per item
type ModalControls = {
  open: () => void;
  openOriginless?: () => void; // NEW
  close: (velocity?: number) => void;
};

export const VerseCarousel = forwardRef<VerseCarouselRef>((props, ref) => {
  const verseDays = [-6, -5, -4, -3, -2, -1, 0]; // 0 = today
  const todayIndex = verseDays.indexOf(0); // should be 6
  const [currentIndex, setCurrentIndex] = useState(todayIndex);
  const flatListRef = useRef<FlatList>(null);

  // Fetch ALL verse data up front using hooks
  const verseDataByOffset = Object.fromEntries(
    verseDays.map((offset) => [offset, useVerseData(offset)])
  );

  // Store refs to each modal controller
  const modalControlsRef = useRef<ModalControls[]>([]); // 🔧 typed

  // Selected verse for modal display
  const [selectedVerseData, setSelectedVerseData] = useState<{
    verse: string | null;
    reference: string | null;
    formattedDate: string;
    chapterText?: string | null;
    chapterReference?: string | null;
    bibleVersion?: string | null;
    index: number;
    initialView?: "verse" | "context";
  } | null>(null);

  // Expose function to open today’s verse in context
  useImperativeHandle(ref, () => ({
    openTodayInContext: () => {
      const todayData = verseDataByOffset[0]; // offset 0 = today
      setSelectedVerseData({
        verse: todayData.verse,
        reference: todayData.reference,
        formattedDate: todayData.formattedDate,
        chapterText: todayData.chapterText,
        chapterReference: todayData.chapterReference,
        bibleVersion: todayData.bibleVersion,
        index: todayIndex,
        initialView: "context",
      });

      const controls = modalControlsRef.current[todayIndex];
      // Prefer originless fallback when opened programmatically
      if (controls?.openOriginless) {
        controls.openOriginless();
      } else if (controls?.open) {
        controls.open(); // graceful fallback if not yet available
      }
    },
  }));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentIndex(index);
  };

  return (
    <View style={{ marginHorizontal: -24 }}>
      <FlatList
        ref={flatListRef}
        data={verseDays}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        initialScrollIndex={todayIndex}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        renderItem={({ item, index }) => {
          const verseData = verseDataByOffset[item];

          return (
            <View style={{ width: screenWidth, paddingHorizontal: 24 }}>
              <ButtonModalTransitionBridge>
                {({
                  open,
                  openOriginless, // 👈 NEW
                  close,
                  isModalVisible,
                  progress,
                  buttonAnimatedStyle,
                  modalAnimatedStyle,
                  buttonRef,
                  handlePressIn,
                  handlePressOut,
                }) => {
                  // Save both open variants so the ref can choose originless for global intent
                  modalControlsRef.current[index] = {
                    open,
                    openOriginless,
                    close,
                  };

                  return (
                    <>
                      <VerseCard
                        offsetDays={item}
                        index={index}
                        total={verseDays.length}
                        currentIndex={currentIndex}
                        buttonRef={buttonRef}
                        style={buttonAnimatedStyle}
                        preloadedData={verseData}
                        onPress={(verse, reference, formattedDate) => {
                          setSelectedVerseData({
                            verse,
                            reference,
                            formattedDate,
                            chapterText: verseData.chapterText,
                            chapterReference: verseData.chapterReference,
                            bibleVersion: verseData.bibleVersion,
                            index,
                            initialView: "verse",
                          });
                          open(); // tap → keep the morph-from-card animation
                        }}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                      />

                      <VerseModal
                        isVisible={isModalVisible}
                        progress={progress}
                        modalAnimatedStyle={modalAnimatedStyle}
                        close={close}
                        verse={selectedVerseData?.verse ?? null}
                        formattedDate={selectedVerseData?.formattedDate ?? ""}
                        reference={selectedVerseData?.reference ?? null}
                        index={selectedVerseData?.index}
                        currentIndex={currentIndex}
                        total={verseDays.length}
                        initialView={selectedVerseData?.initialView ?? "verse"}
                        chapterText={selectedVerseData?.chapterText ?? ""}
                        chapterReference={
                          selectedVerseData?.chapterReference ??
                          selectedVerseData?.reference ??
                          ""
                        }
                        bibleVersion={selectedVerseData?.bibleVersion ?? "ESV"}
                      />
                    </>
                  );
                }}
              </ButtonModalTransitionBridge>
            </View>
          );
        }}
      />
    </View>
  );
});
