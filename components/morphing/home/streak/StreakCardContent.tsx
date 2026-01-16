// StreakCardContent.tsx (updated with undo functionality)
import { AppearingText } from "@/components/text-animation/AppearingText";
import { PartialAnimatedText } from "@/components/text-animation/PartialAnimatedText";
import { TransitioningText } from "@/components/text-animation/TransitioningText";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import {
  STRINGS,
  type StreakEntry,
  formatDate,
  getCurrentStreak,
  getDateToAskAbout,
  getFailureMessage,
  getPersonalBest,
  hadNewPersonalBest,
  isYesterday,
} from "./streakUtils";

interface StreakCardContentProps {
  streakData: StreakEntry[];
  onCheckIn: (status: "success" | "fail") => void;
  onUndo?: (date: string) => void;
  showButtons?: boolean;
  // NEW: External undo state (optional - if not provided, use internal state)
  showUndo?: boolean;
  lastModifiedDate?: string | null;
  onUndoStateChange?: (showUndo: boolean, date: string | null) => void;
}

export function StreakCardContent({
  streakData,
  onCheckIn,
  onUndo,
  showButtons = true,
  showUndo: externalShowUndo,
  lastModifiedDate: externalLastModifiedDate,
  onUndoStateChange,
}: StreakCardContentProps) {
  const { colors } = useTheme();

  // Internal state (fallback if no external state provided)
  const [internalLastModifiedDate, setInternalLastModifiedDate] = useState<
    string | null
  >(null);
  const [internalShowUndo, setInternalShowUndo] = useState(false);

  // Use external state if provided, otherwise use internal state
  const showUndo =
    externalShowUndo !== undefined ? externalShowUndo : internalShowUndo;
  const lastModifiedDate =
    externalLastModifiedDate !== undefined
      ? externalLastModifiedDate
      : internalLastModifiedDate;

  const currentStreak = getCurrentStreak(streakData);
  const personalBest = getPersonalBest(streakData);
  const dateToAsk = getDateToAskAbout(streakData);
  const hasActiveStreak = currentStreak > 0;

  const updateUndoState = (show: boolean, date: string | null) => {
    if (onUndoStateChange) {
      // External state management
      onUndoStateChange(show, date);
    } else {
      // Internal state management
      setInternalShowUndo(show);
      setInternalLastModifiedDate(date);
    }
  };

  const handleSuccessPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const date = dateToAsk?.date;
    onCheckIn("success");
    if (date) {
      updateUndoState(true, date);
    }
  };

  const handleFailPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const date = dateToAsk?.date;
    onCheckIn("fail");
    if (date) {
      updateUndoState(true, date);
    }
  };

  const handleUndo = () => {
    if (lastModifiedDate && onUndo) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUndo(lastModifiedDate);
      updateUndoState(false, null);
    }
  };

  const ComeBackBanner = () => (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.bannerBackground,
          borderColor: colors.bannerBorder,
        },
      ]}
    >
      <IconSymbol
        name="calendar"
        color={colors.textSecondary}
        size={20}
        style={{ marginRight: 8 }}
      />
      <ThemedText
        type="body"
        style={[
          styles.bannerText,
          {
            color: colors.textSecondary,
            opacity: 0.8,
          },
        ]}
      >
        {STRINGS.BANNER_COME_BACK_TOMORROW}
      </ThemedText>
    </View>
  );

  const CheckInButtons = () => {
    if (!showButtons) return null;

    return (
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.checkinButton,
            { backgroundColor: colors.buttonBackground },
          ]}
          onPress={handleSuccessPress}
          activeOpacity={0.85}
        >
          <IconSymbol
            name="checkmark.circle.fill"
            color={colors.white}
            size={22}
            style={{ marginRight: 8 }}
          />
          <ThemedText
            type="button"
            style={[styles.buttonText, { color: colors.white }]}
          >
            {STRINGS.BUTTON_PORN_FREE}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkinButton, { backgroundColor: colors.error }]}
          onPress={handleFailPress}
          activeOpacity={0.85}
        >
          <IconSymbol
            name="xmark.circle.fill"
            color={colors.white}
            size={22}
            style={{ marginRight: 8 }}
          />
          <ThemedText
            type="button"
            style={[styles.buttonText, { color: colors.white }]}
          >
            {STRINGS.BUTTON_I_SLIPPED}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const UndoButton = () => {
    if (!showUndo) return null;

    return (
      <TouchableOpacity
        onPress={handleUndo}
        style={styles.undoContainer}
        activeOpacity={0.7}
      >
        <ThemedText
          type="captionMedium"
          style={[
            styles.undoText,
            {
              color: colors.textSecondary,
              textDecorationLine: "underline",
            },
          ]}
        >
          Undo
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const ExpandIcon = () => (
    <IconSymbol
      name="arrow.up.left.and.arrow.down.right"
      size={18}
      color={colors.textSecondary}
      style={styles.expandIcon}
    />
  );

  if (!dateToAsk) {
    if (hasActiveStreak) {
      const daysFromBest = personalBest - currentStreak;
      const encouragement =
        daysFromBest > 0 && daysFromBest <= 7
          ? STRINGS.ENCOURAGE_CLOSE_TO_BEST(daysFromBest)
          : currentStreak >= personalBest
          ? STRINGS.ENCOURAGE_NEW_BEST
          : STRINGS.ENCOURAGE_KEEP_GOING;

      return (
        <View style={{ position: "relative" }}>
          <ExpandIcon />

          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.iconCircleBackground },
              ]}
            >
              <IconSymbol
                name="flame.fill"
                size={32}
                color={colors.fireColor}
              />
            </View>
            <View style={styles.titleContainer}>
              <PartialAnimatedText
                staticText={STRINGS.TITLE_YOUR_STREAK + " "}
                dynamicText={`${currentStreak} ${
                  currentStreak === 1 ? STRINGS.DAY : STRINGS.DAYS
                }`}
                animationKey={currentStreak}
                type="title"
                style={[styles.title, { color: colors.text }]}
                dynamicStyle={{ color: colors.fireColor }}
              />
              {personalBest > 0 ? (
                <PartialAnimatedText
                  staticText="Personal Best: "
                  dynamicText={`${personalBest} ${
                    personalBest === 1 ? "Day" : "Days"
                  }`}
                  animationKey={personalBest}
                  type="subtitle"
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                />
              ) : (
                <ThemedText
                  type="subtitle"
                  style={[
                    styles.subtitle,
                    {
                      color: colors.textSecondary,
                      marginTop: 2,
                      opacity: 0.85,
                    },
                  ]}
                >
                  {STRINGS.SUBTITLE_BEGIN_TRACKING}
                </ThemedText>
              )}
            </View>
          </View>

          <AppearingText animationKey={`success-${currentStreak}`}>
            <ThemedText
              type="captionMedium"
              style={[
                styles.encouragement,
                {
                  color: colors.textSecondary,
                  opacity: 0.8,
                  marginTop: 6,
                },
              ]}
            >
              {encouragement}
            </ThemedText>
          </AppearingText>
          <AppearingText animationKey="banner-success">
            <ComeBackBanner />
          </AppearingText>
          <UndoButton />
        </View>
      );
    } else {
      const encouragement = getFailureMessage(true, streakData);

      return (
        <View style={{ position: "relative" }}>
          <ExpandIcon />

          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.iconCircleBackground },
              ]}
            >
              <IconSymbol
                name="flame.fill"
                size={32}
                color={colors.fireColor}
              />
            </View>
            <View style={styles.titleContainer}>
              <TransitioningText animationKey="restart-title">
                <ThemedText
                  type="title"
                  style={[styles.title, { color: colors.text }]}
                >
                  {STRINGS.TITLE_START_NEW_STREAK}
                </ThemedText>
              </TransitioningText>
              {personalBest > 0 ? (
                <PartialAnimatedText
                  staticText="Personal Best: "
                  dynamicText={`${personalBest} ${
                    personalBest === 1 ? "Day" : "Days"
                  }`}
                  animationKey={personalBest}
                  type="subtitle"
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                />
              ) : (
                <ThemedText
                  type="subtitle"
                  style={[
                    styles.subtitle,
                    {
                      color: colors.textSecondary,
                      marginTop: 2,
                      opacity: 0.85,
                    },
                  ]}
                >
                  {STRINGS.SUBTITLE_BEGIN_TRACKING}
                </ThemedText>
              )}
            </View>
          </View>

          <AppearingText
            animationKey={`fail-${hadNewPersonalBest(streakData)}`}
          >
            <ThemedText
              type="captionMedium"
              style={[
                styles.encouragement,
                {
                  color: colors.textSecondary,
                  opacity: 0.8,
                  marginTop: 6,
                },
              ]}
            >
              {encouragement}
            </ThemedText>
          </AppearingText>
          <AppearingText animationKey="banner-fail">
            <ComeBackBanner />
          </AppearingText>
          <UndoButton />
        </View>
      );
    }
  }

  // CASE 2: Has pending days
  return (
    <View style={{ position: "relative" }}>
      <ExpandIcon />

      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol name="flame.fill" size={32} color={colors.fireColor} />
        </View>
        <View style={styles.titleContainer}>
          {hasActiveStreak ? (
            <PartialAnimatedText
              staticText={STRINGS.TITLE_YOUR_STREAK + " "}
              dynamicText={`${currentStreak} ${
                currentStreak === 1 ? STRINGS.DAY : STRINGS.DAYS
              }`}
              animationKey={currentStreak}
              type="title"
              style={[styles.title, { color: colors.text }]}
              dynamicStyle={{ color: colors.fireColor }}
            />
          ) : (
            <TransitioningText animationKey="start">
              <ThemedText
                type="title"
                style={[styles.title, { color: colors.text }]}
              >
                {STRINGS.TITLE_START_STREAK}
              </ThemedText>
            </TransitioningText>
          )}
          {personalBest > 0 ? (
            <PartialAnimatedText
              staticText="Personal Best: "
              dynamicText={`${personalBest} ${
                personalBest === 1 ? "Day" : "Days"
              }`}
              animationKey={personalBest}
              type="subtitle"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            />
          ) : (
            <ThemedText
              type="subtitle"
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  marginTop: 2,
                  opacity: 0.85,
                },
              ]}
            >
              {STRINGS.SUBTITLE_BEGIN_TRACKING}
            </ThemedText>
          )}
        </View>
      </View>

      {!hasActiveStreak && personalBest > 0 && (
        <AppearingText
          animationKey={`restart-encourage-${hadNewPersonalBest(streakData)}`}
        >
          <ThemedText
            type="captionMedium"
            style={[
              styles.encouragement,
              {
                color: colors.textSecondary,
                marginBottom: 10,
                opacity: 0.8,
                marginTop: 6,
              },
            ]}
          >
            {getFailureMessage(false, streakData)}
          </ThemedText>
        </AppearingText>
      )}

      <PartialAnimatedText
        staticText={
          isYesterday(dateToAsk.date) ? "How did you do " : "How did you do on "
        }
        dynamicText={
          isYesterday(dateToAsk.date)
            ? "yesterday?"
            : `${formatDate(dateToAsk.date)}?`
        }
        animationKey={dateToAsk.date}
        type="captionMedium"
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            lineHeight: 22,
            marginBottom: 18,
            opacity: 0.95,
          },
        ]}
      />

      <CheckInButtons />
      <UndoButton />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    lineHeight: 24,
  },
  subtitle: {},
  description: {},
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  checkinButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
  },
  buttonText: {},
  encouragement: {},
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: {},
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
  },
  undoContainer: {
    alignItems: "center",
    paddingVertical: 0,
    marginTop: 8,
  },
  undoText: {},
});
