import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { db } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { CarouselDots } from "./CarouselDots"; // Adjust path if needed

export function VerseCard({
  offsetDays = 0,
  index,
  currentIndex,
  total,
}: {
  offsetDays?: number;
  index?: number;
  currentIndex?: number;
  total?: number;
}) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const router = useRouter();

  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);

  const dateId = date.toISOString().split("T")[0];
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 30,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scale, {
      toValue: 1,
      speed: 30,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [prayerContent, setPrayerContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const docRef = doc(db, "dailyContent", dateId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVerse(data.verse ?? null);
          setReference(data.reference ?? null);
          setPrayerContent(data.prayerContent ?? null);
        } else {
          setVerse(null);
        }
      } catch (err) {
        console.error("Error fetching verse:", err);
        setVerse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, [dateId]);

  const handlePress = () => {
    const params = new URLSearchParams({
      date: formattedDate,
      verseText: verse ?? "",
      reference: reference ?? "",
      prayerContent: prayerContent ?? "",
      offsetDays: offsetDays.toString(),
    });
    router.push(`/modal?${params.toString()}`);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

  if (!verse) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            padding: 32,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ThemedText
          type="caption"
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          No content available for {formattedDate}
        </ThemedText>
      </View>
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Top-right icon */}
        <IconSymbol
          name="arrow.up.left.and.arrow.down.right"
          size={18}
          color={colors.icon}
          style={styles.topRightIcon}
        />

        {/* Bottom-left date */}
        <ThemedText
          type="captionMedium"
          style={[
            styles.bottomLeftDate,
            { color: colors.textSecondary, opacity: 0.6 },
          ]}
        >
          {formattedDate}
        </ThemedText>

        {/* Open quote mark */}
        <ThemedText
          type="quote"
          style={[
            styles.openQuote,
            { color: colors.textSecondary, opacity: 0.6 },
          ]}
        >
          ❝
        </ThemedText>

        {/* Main verse text, max 3 lines */}
        <ThemedText
          type="verse"
          numberOfLines={3}
          ellipsizeMode="tail"
          style={[
            styles.verseText,
            {
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 40,
              marginBottom: 8,
            },
          ]}
        >
          {verse}
        </ThemedText>

        {/* Reference */}
        <View style={styles.referenceContainer}>
          <ThemedText
            type="caption"
            style={[
              styles.reference,
              {
                color: colors.textSecondary,
                fontStyle: "italic",
                opacity: 0.8,
              },
            ]}
          >
            {reference}
          </ThemedText>
        </View>

        {/* Carousel Dots (bottom-center) */}
        {typeof index === "number" &&
          typeof currentIndex === "number" &&
          typeof total === "number" && (
            <View style={styles.dotsContainer}>
              <CarouselDots currentIndex={currentIndex} total={total} />
            </View>
          )}
      </Animated.View>
    </Pressable>
  );
}

const cardPadding = 24;

const styles = StyleSheet.create({
  card: {
    padding: cardPadding,
    borderRadius: 20,
    marginTop: 24,
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  verseText: {},
  openQuote: {
    position: "absolute",
    top: cardPadding,
    left: cardPadding,
  },
  referenceContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  reference: {},
  topRightIcon: {
    position: "absolute",
    top: cardPadding,
    right: cardPadding,
    opacity: 0.85,
  },
  bottomLeftDate: {
    position: "absolute",
    bottom: cardPadding,
    left: cardPadding,
  },
  dotsContainer: {
    position: "absolute",
    bottom: cardPadding,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
