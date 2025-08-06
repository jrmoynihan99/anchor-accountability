import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerseModal() {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get the data passed from the VerseCard
  const { date, verseText, reference, offsetDays } = useLocalSearchParams();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Close button */}
      <Pressable
        style={[styles.closeButton, { top: insets.top + 20 }]}
        onPress={() => router.back()}
      >
        <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
      </Pressable>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date header */}
        <Text style={[styles.dateHeader, { color: colors.icon }]}>{date}</Text>

        {/* Large quote mark */}
        <Text style={[styles.largeQuote, { color: colors.buttonBackground }]}>
          ❝
        </Text>

        {/* Verse text - larger and more prominent */}
        <Text style={[styles.verseText, { color: colors.buttonBackground }]}>
          {verseText}
        </Text>

        {/* Reference */}
        <Text style={[styles.reference, { color: colors.icon }]}>
          {reference}
        </Text>

        {/* Additional content area - you can add whatever you want here */}
        <View style={styles.additionalContent}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reflection
          </Text>
          <Text style={[styles.reflectionText, { color: colors.text }]}>
            This is where you could add reflection questions, commentary, or any
            other content you want for this verse.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  largeQuote: {
    fontSize: 120,
    fontWeight: "200",
    lineHeight: 120,
    textAlign: "center",
    opacity: 0.3,
    fontFamily: "serif",
    marginBottom: 20,
  },
  verseText: {
    fontSize: 36,
    lineHeight: 48,
    textAlign: "center",
    fontWeight: "500",
    fontStyle: "italic",
    letterSpacing: 0.5,
    marginBottom: 30,
    fontFamily: "Spectral_700Bold_Italic",
  },
  reference: {
    fontSize: 16,
    fontWeight: "500",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 50,
    opacity: 0.8,
  },
  additionalContent: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  reflectionText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
});
