import { GuidedPrayer } from "@/components/GuidedPrayer";
import { ReachOutButton } from "@/components/ReachOutButton";
import { VerseCarousel } from "@/components/VerseCarousel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const theme = useColorScheme();
  const bgColor = Colors[theme ?? "dark"].background;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 120, // Extra space for floating navigation
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <VerseCarousel />

        <ReachOutButton
          onPress={() => {
            // Handle reach out button press
            console.log("Reach out button pressed...");
          }}
        />

        <GuidedPrayer
          onPress={() => {
            // Handle guided prayer start
            console.log("Starting guided prayer...");
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
});
