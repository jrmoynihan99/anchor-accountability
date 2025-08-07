import { AppearingText } from "@/components/text-animation/AppearingText";
import { PartialAnimatedText } from "@/components/text-animation/PartialAnimatedText";
import { TransitioningText } from "@/components/text-animation/TransitioningText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const mainTextColor = "#3A2D28";
  const accent = colors.tint;
  const fireBg = "#FFF3E0";
  const fireColor = "#F47C1A";

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
    <View style={styles.banner}>
      <IconSymbol
        name="calendar"
        color={colors.icon}
        size={20}
        style={{ marginRight: 8 }}
      />
      <Text style={[styles.bannerText, { color: colors.icon }]}>
        {STRINGS.BANNER_COME_BACK_TOMORROW}
      </Text>
    </View>
  );

  const CheckInButtons = () => {
    if (!showButtons) return null;

    return (
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.checkinButton, { backgroundColor: accent }]}
          onPress={handleSuccessPress}
          activeOpacity={0.85}
        >
          <IconSymbol
            name="checkmark.circle.fill"
            color="#fff"
            size={22}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>{STRINGS.BUTTON_PORN_FREE}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkinButton, { backgroundColor: "#E57373" }]}
          onPress={handleFailPress}
          activeOpacity={0.85}
        >
          <IconSymbol
            name="xmark.circle.fill"
            color="#fff"
            size={22}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>{STRINGS.BUTTON_I_SLIPPED}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ExpandIcon = () => (
    <IconSymbol
      name="arrow.up.left.and.arrow.down.right"
      size={18}
      color="#8D7963"
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
            <View style={[styles.iconCircle, { backgroundColor: fireBg }]}>
              <IconSymbol name="flame.fill" size={32} color={fireColor} />
            </View>
            <View style={styles.titleContainer}>
              <PartialAnimatedText
                staticText={STRINGS.TITLE_YOUR_STREAK + " "}
                dynamicText={`${currentStreak} ${
                  currentStreak === 1 ? STRINGS.DAY : STRINGS.DAYS
                }`}
                animationKey={currentStreak}
                style={[styles.title, { color: mainTextColor }]}
                dynamicStyle={{ color: fireColor }}
              />
              {personalBest > 0 ? (
                <PartialAnimatedText
                  staticText="Personal Best: "
                  dynamicText={`${personalBest} ${
                    personalBest === 1 ? "Day" : "Days"
                  }`}
                  animationKey={personalBest}
                  style={styles.subtitle}
                />
              ) : (
                <Text style={styles.subtitle}>
                  {STRINGS.SUBTITLE_BEGIN_TRACKING}
                </Text>
              )}
            </View>
          </View>

          <AppearingText animationKey={`success-${currentStreak}`}>
            <Text style={[styles.encouragement, { color: colors.icon }]}>
              {encouragement}
            </Text>
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
            <View style={[styles.iconCircle, { backgroundColor: fireBg }]}>
              <IconSymbol name="flame.fill" size={32} color={fireColor} />
            </View>
            <View style={styles.titleContainer}>
              <TransitioningText animationKey="restart-title">
                <Text style={[styles.title, { color: mainTextColor }]}>
                  {STRINGS.TITLE_START_NEW_STREAK}
                </Text>
              </TransitioningText>
              {personalBest > 0 ? (
                <PartialAnimatedText
                  staticText="Personal Best: "
                  dynamicText={`${personalBest} ${
                    personalBest === 1 ? "Day" : "Days"
                  }`}
                  animationKey={personalBest}
                  style={styles.subtitle}
                />
              ) : (
                <Text style={styles.subtitle}>
                  {STRINGS.SUBTITLE_BEGIN_TRACKING}
                </Text>
              )}
            </View>
          </View>

          <AppearingText
            animationKey={`fail-${hadNewPersonalBest(streakData)}`}
          >
            <Text style={[styles.encouragement, { color: colors.icon }]}>
              {encouragement}
            </Text>
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
        <View style={[styles.iconCircle, { backgroundColor: fireBg }]}>
          <IconSymbol name="flame.fill" size={32} color={fireColor} />
        </View>
        <View style={styles.titleContainer}>
          {hasActiveStreak ? (
            <PartialAnimatedText
              staticText={STRINGS.TITLE_YOUR_STREAK + " "}
              dynamicText={`${currentStreak} ${
                currentStreak === 1 ? STRINGS.DAY : STRINGS.DAYS
              }`}
              animationKey={currentStreak}
              style={[styles.title, { color: mainTextColor }]}
              dynamicStyle={{ color: fireColor }}
            />
          ) : (
            <TransitioningText animationKey="start">
              <Text style={[styles.title, { color: mainTextColor }]}>
                {STRINGS.TITLE_START_STREAK}
              </Text>
            </TransitioningText>
          )}
          {personalBest > 0 ? (
            <PartialAnimatedText
              staticText="Personal Best: "
              dynamicText={`${personalBest} ${
                personalBest === 1 ? "Day" : "Days"
              }`}
              animationKey={personalBest}
              style={styles.subtitle}
            />
          ) : (
            <Text style={styles.subtitle}>
              {STRINGS.SUBTITLE_BEGIN_TRACKING}
            </Text>
          )}
        </View>
      </View>

      {!hasActiveStreak && personalBest > 0 && (
        <AppearingText
          animationKey={`restart-encourage-${hadNewPersonalBest(streakData)}`}
        >
          <Text
            style={[
              styles.encouragement,
              { color: colors.icon, marginBottom: 10 },
            ]}
          >
            {getFailureMessage(false, streakData)}
          </Text>
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
        style={[styles.description, { color: colors.icon }]}
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
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
    color: "#8D7963",
    opacity: 0.85,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    opacity: 0.95,
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  encouragement: {
    fontSize: 15,
    opacity: 0.8,
    marginTop: 6,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 12,
    backgroundColor: "rgba(116, 116, 128, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(116, 116, 128, 0.12)",
  },
  bannerText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
  },
});
