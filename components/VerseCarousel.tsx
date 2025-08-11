import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";
import { VerseCard } from "./VerseCard";

const screenWidth = Dimensions.get("window").width;

export function VerseCarousel() {
  const verseDays = [-6, -5, -4, -3, -2, -1, 0]; // 0 = today
  const todayIndex = verseDays.indexOf(0); // This will be 6
  const [currentIndex, setCurrentIndex] = useState(todayIndex);
  const flatListRef = useRef<FlatList>(null);

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
        initialScrollIndex={todayIndex} // Start on today's verse
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        renderItem={({ item, index }) => (
          <View style={{ width: screenWidth, paddingHorizontal: 24 }}>
            <VerseCard
              offsetDays={item}
              index={index}
              total={verseDays.length}
              currentIndex={currentIndex}
            />
          </View>
        )}
      />
    </View>
  );
}
