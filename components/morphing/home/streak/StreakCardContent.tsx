// StreakCardContent.tsx (updated to pass `type` to PartialAnimatedText)
import { AppearingText } from "@/components/text-animation/AppearingText";
import { PartialAnimatedText } from "@/components/text-animation/PartialAnimatedText";
import { TransitioningText } from "@/components/text-animation/TransitioningText";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
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
  showButtons?: boolean;
}

export function StreakCardContent({
  streakData,
  onCheckIn,
  showButtons = true,
}: StreakCardContentProps) {
  const { colors } = useTheme();

  const currentStreak = getCurrentStreak(streakData);
  const personalBest = getPersonalBest(streakData);
  const dateToAsk = getDateToAskAbout(streakData);
  const hasActiveStreak = currentStreak > 0;

  const handleSuccessPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCheckIn("success");
  };

  const handleFailPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCheckIn("fail");
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
        color={colors.icon}
        size={20}
        style={{ marginRight: 8 }}
      />
      <ThemedText
        type="body"
        style={[
          styles.bannerText,
          {
            color: colors.icon,
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
    // Typography.styles.title applies via ThemedText/PartialAnimatedText
    lineHeight: 24,
  },
  subtitle: {
    // Typography.styles.subtitle applies via ThemedText/PartialAnimatedText
  },
  description: {
    // Typography.styles.captionMedium applies via PartialAnimatedText
  },
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
  buttonText: {
    // Typography.styles.button handled by ThemedText type="button"
  },
  encouragement: {
    // Typography.styles.captionMedium handled by ThemedText
  },
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
  bannerText: {
    // Typography.styles.body handled by ThemedText
  },
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
  },
});
