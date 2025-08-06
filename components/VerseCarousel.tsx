import React from "react";
import { Dimensions, FlatList, View } from "react-native";
import { VerseCard } from "./VerseCard";

const screenWidth = Dimensions.get("window").width;

export function VerseCarousel() {
  // Example: 3 days of verses
  const verseDays = [-2, -1, 0]; // Aug 3, 4, 5 (today = 0)

  return (
    <View style={{ marginHorizontal: -24 }}>
      <FlatList
        data={verseDays}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            style={{
              width: screenWidth,
              paddingHorizontal: 24,
            }}
          >
            <VerseCard offsetDays={item} />
          </View>
        )}
      />
    </View>
  );
}
