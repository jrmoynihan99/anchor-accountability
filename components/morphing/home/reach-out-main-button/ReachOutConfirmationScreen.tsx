// ReachOutConfirmationScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

interface ReachOutConfirmationScreenProps {
  onClose: () => void;
  crisis?: boolean;
}

interface FleeAction {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  encouragement: string;
}

const FLEE_ACTIONS: FleeAction[] = [
  {
    icon: "walk",
    title: "Go for a walk/run",
    subtitle: "Get outside and move",
    encouragement: "Go for that walk.",
  },
  {
    icon: "barbell",
    title: "Hit the gym",
    subtitle: "Channel it into a workout",
    encouragement: "Go hit the gym.",
  },
  {
    icon: "cafe",
    title: "Go get coffee/food",
    subtitle: "Grab something to eat or drink",
    encouragement: "Go grab that coffee.",
  },
  {
    icon: "people",
    title: "Go to a public place",
    subtitle: "Get yourself around other people",
    encouragement: "Get yourself out there.",
  },
];

export function ReachOutConfirmationScreen({
  onClose,
  crisis,
}: ReachOutConfirmationScreenProps) {
  const { colors, effectiveTheme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [committed, setCommitted] = useState(false);

  const mainTextColor = effectiveTheme === "dark" ? colors.text : colors.text;

  const handleCallHotline = () => {
    Linking.openURL("tel:988");
  };

  const handleTextHotline = () => {
    Linking.openURL("sms:988");
  };

  const handleSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIndex(index);
  };

  const handleCommit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCommitted(true);
  };

  const handleDonePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  if (committed && selectedIndex !== null) {
    const chosen = FLEE_ACTIONS[selectedIndex];
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.encouragementContainer}
      >
        <Ionicons
          name={chosen.icon}
          size={48}
          color={mainTextColor}
          style={{ marginBottom: 20 }}
        />
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginBottom: 12 }}
        >
          {chosen.encouragement}
        </ThemedText>
        <ThemedText
          type="body"
          style={{
            textAlign: "center",
            color: colors.textSecondary,
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          Your community will respond in the meantime.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.doneButton,
            { backgroundColor: colors.secondaryButtonBackground },
          ]}
          onPress={handleDonePress}
        >
          <ThemedText type="buttonLarge" style={{ color: colors.background }}>
            Done
          </ThemedText>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header with Icon */}
      <View style={styles.modalHeader}>
        <Ionicons name="checkmark-circle" size={40} color={mainTextColor} />
        <ThemedText
          type="titleLarge"
          style={{
            color: mainTextColor,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Message Sent!
        </ThemedText>
      </View>

      <ThemedText
        type="body"
        style={{
          color: mainTextColor,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Your community will see your message. In the meantime...
      </ThemedText>

      {crisis && (
        <View
          style={[
            styles.crisisBanner,
            {
              backgroundColor: `${colors.error}15`,
              borderColor: colors.error,
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={20}
            color={colors.error}
            style={{ marginBottom: 8 }}
          />
          <ThemedText
            type="body"
            style={{
              color: mainTextColor,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            If you or someone you know is struggling, you are not alone. Please
            reach out to the 988 Suicide & Crisis Lifeline.
          </ThemedText>
          <View style={styles.crisisButtons}>
            <TouchableOpacity
              style={[styles.crisisButton, { backgroundColor: colors.error }]}
              onPress={handleCallHotline}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <ThemedText
                type="buttonLarge"
                style={{ color: "#fff", marginLeft: 6 }}
              >
                Call 988
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.crisisButton,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: colors.error,
                },
              ]}
              onPress={handleTextHotline}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble" size={16} color={colors.error} />
              <ThemedText
                type="buttonLarge"
                style={{ color: colors.error, marginLeft: 6 }}
              >
                Text 988
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.recommendationsContainer}>
        <ThemedText
          type="title"
          style={{
            color: mainTextColor,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          "Flee sexual immorality"
        </ThemedText>

        <View style={styles.grid}>
          {FLEE_ACTIONS.map((action, index) => {
            const isSelected = selectedIndex === index;
            const isDimmed = selectedIndex !== null && !isSelected;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.gridCard,
                  {
                    backgroundColor: colors.modalCardBackground,
                    borderColor: isSelected
                      ? colors.tint
                      : colors.modalCardBorder,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: isDimmed ? 0.4 : 1,
                  },
                ]}
                onPress={() => handleSelect(index)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.gridIconContainer,
                    {
                      backgroundColor: isSelected
                        ? `${colors.tint}20`
                        : colors.iconCircleSecondaryBackground,
                    },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={24}
                    color={isSelected ? colors.tint : mainTextColor}
                  />
                </View>
                <ThemedText
                  type="body"
                  style={{
                    color: mainTextColor,
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  {action.title}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedIndex !== null ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          layout={LinearTransition}
        >
          <TouchableOpacity
            style={[
              styles.doneButton,
              { backgroundColor: colors.secondaryButtonBackground },
            ]}
            onPress={handleCommit}
          >
            <ThemedText type="buttonLarge" style={{ color: colors.background }}>
              I'm gonna do this
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <View
          style={[
            styles.doneButton,
            {
              backgroundColor: colors.secondaryButtonBackground,
              opacity: 0.35,
            },
          ]}
        >
          <ThemedText type="buttonLarge" style={{ color: colors.background }}>
            Choose one
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
  },
  recommendationsContainer: {
    width: "100%",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  encouragementContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  crisisBanner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  crisisButtons: {
    flexDirection: "column",
    gap: 10,
    width: "100%",
  },
  crisisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
