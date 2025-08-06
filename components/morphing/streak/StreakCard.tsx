import { AnimatedText } from "@/components/AnimatedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ================== STRINGS CONFIGURATION ==================
const STRINGS = {
  // Titles
  TITLE_START_STREAK: "Start a Streak!",
  TITLE_START_NEW_STREAK: "Start A New Streak Tomorrow",
  TITLE_YOUR_STREAK: "Your Streak:",

  // Subtitles
  SUBTITLE_PERSONAL_BEST: (best: number) =>
    `Personal Best: ${best} ${best === 1 ? "Day" : "Days"}`,
  SUBTITLE_BEGIN_TRACKING: "Check in to begin tracking your progress.",

  // Questions
  QUESTION_YESTERDAY: "How did you do yesterday?",
  QUESTION_ON_DATE: (date: string) => `How did you do on ${date}?`,

  // Buttons
  BUTTON_PORN_FREE: "Porn Free",
  BUTTON_I_SLIPPED: "I Slipped",

  // Banner messages
  BANNER_COME_BACK_TOMORROW: "Come back tomorrow!",

  // Encouragement messages
  ENCOURAGE_START_AGAIN: "Relapses happen. How have you been since?",
  ENCOURAGE_RELAPSE_EARLIER_DAY:
    "Keep your head up. God loves you. Reach out for instant anonymous help at any time.",
  ENCOURAGE_RELAPSE_EARLIER_DAY_NEW_BEST:
    "Keep your head up. God loves you. Reach out for instant anonymous help at any time (and congrats on the new personal best, let's beat it!)",
  ENCOURAGE_RELAPSE_YESTERDAY:
    "Keep your head up. God loves you. Reach out for instant anonymous help at any time. Let's get started again tomorrow!",
  ENCOURAGE_RELAPSE_YESTERDAY_NEW_BEST:
    "Keep your head up. God loves you. Reach out for instant anonymous help at any time (and congrats on the new personal best, let's beat it starting tomorrow!)",
  ENCOURAGE_CLOSE_TO_BEST: (days: number) =>
    `You're only ${days} ${
      days === 1 ? "day" : "days"
    } away from your personal best! Come back tomorrow to continue.`,
  ENCOURAGE_NEW_BEST:
    "New personal best! Amazing job! Come back tomorrow to keep it going.",
  ENCOURAGE_KEEP_GOING:
    "Great job! Check in again tomorrow to keep your streak alive.",

  // Units
  DAY: "Day",
  DAYS: "Days",
};

// ================== TYPES ==================
interface StreakEntry {
  date: string;
  status: "success" | "fail" | "pending";
}

interface StreakCardProps {
  streakData: StreakEntry[];
  onCheckIn: (status: "success" | "fail") => void;
}

// ================== UTILITY FUNCTIONS ==================
const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
};

const isYesterday = (dateStr: string) => dateStr === getYesterday();

const isToday = (dateStr: string) => {
  const today = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  const checkDate = new Date(year, month - 1, day);
  return today.toDateString() === checkDate.toDateString();
};

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// ================== STREAK CALCULATIONS ==================
const getCurrentStreak = (streakData: StreakEntry[]) => {
  const sorted = [...streakData].sort((a, b) => a.date.localeCompare(b.date));
  let streak = 0;
  let lastFailIndex = -1;

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].status === "fail") {
      lastFailIndex = i;
      break;
    }
  }

  for (let i = lastFailIndex + 1; i < sorted.length; i++) {
    if (sorted[i].status === "success") {
      streak++;
    }
  }

  return streak;
};

const getPersonalBest = (streakData: StreakEntry[]) => {
  const sorted = [...streakData].sort((a, b) => a.date.localeCompare(b.date));
  let maxStreak = 0;
  let currentStreak = 0;

  for (const entry of sorted) {
    if (entry.status === "success") {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (entry.status === "fail") {
      currentStreak = 0;
    }
  }
  return maxStreak;
};

const hadNewPersonalBest = (streakData: StreakEntry[]) => {
  const sorted = [...streakData].sort((a, b) => a.date.localeCompare(b.date));

  let lastFailIndex = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].status === "fail") {
      lastFailIndex = i;
      break;
    }
  }

  if (lastFailIndex === -1) return false;

  let recentStreakLength = 0;
  for (let i = lastFailIndex - 1; i >= 0; i--) {
    if (sorted[i] && sorted[i].status === "success") {
      recentStreakLength++;
    } else {
      break;
    }
  }

  let previousBest = 0;
  let tempStreak = 0;

  const endOfPreviousData = lastFailIndex - recentStreakLength;
  for (let i = 0; i <= endOfPreviousData; i++) {
    if (sorted[i] && sorted[i].status === "success") {
      tempStreak++;
      previousBest = Math.max(previousBest, tempStreak);
    } else if (sorted[i] && sorted[i].status === "fail") {
      tempStreak = 0;
    }
  }

  return recentStreakLength > previousBest;
};

const getDateToAskAbout = (streakData: StreakEntry[]) => {
  const currentStreak = getCurrentStreak(streakData);
  const pendingEntries = streakData.filter((e) => e.status === "pending");

  if (currentStreak === 0) {
    return pendingEntries.find((e) => isYesterday(e.date));
  }

  const yesterdayEntry = streakData.find((e) => isYesterday(e.date));
  if (yesterdayEntry && yesterdayEntry.status === "success") {
    return null;
  }

  const pastPendingEntries = pendingEntries.filter((e) => !isToday(e.date));
  if (pastPendingEntries.length > 0) {
    return pastPendingEntries.sort((a, b) => a.date.localeCompare(b.date))[0];
  }

  return null;
};

const getFailureMessage = (
  isYesterdayFailure: boolean,
  streakData: StreakEntry[]
) => {
  const beatPersonalBest = hadNewPersonalBest(streakData);

  if (isYesterdayFailure) {
    return beatPersonalBest
      ? STRINGS.ENCOURAGE_RELAPSE_YESTERDAY_NEW_BEST
      : STRINGS.ENCOURAGE_RELAPSE_YESTERDAY;
  } else {
    return beatPersonalBest
      ? STRINGS.ENCOURAGE_RELAPSE_EARLIER_DAY_NEW_BEST
      : STRINGS.ENCOURAGE_RELAPSE_EARLIER_DAY;
  }
};

// ================== COMPONENT ==================
export function StreakCard({ streakData, onCheckIn }: StreakCardProps) {
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

  // Debug logging
  console.log("StreakCard Debug:", {
    currentStreak,
    personalBest,
    hasActiveStreak,
    dateToAsk: dateToAsk?.date,
  });

  // Helper: non-animated banner
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

  // Helper: non-animated buttons
  const CheckInButtons = () => (
    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={[styles.checkinButton, { backgroundColor: accent }]}
        onPress={() => onCheckIn("success")}
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
        onPress={() => onCheckIn("fail")}
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

  // CASE 1: No pending days
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
        <View
          style={[styles.container, { backgroundColor: colors.cardBackground }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: fireBg }]}>
              <IconSymbol name="flame.fill" size={32} color={fireColor} />
            </View>
            <View style={styles.titleContainer}>
              {/* Title */}
              <AnimatedText animationKey={`streak-${currentStreak}`}>
                <Text style={[styles.title, { color: mainTextColor }]}>
                  {STRINGS.TITLE_YOUR_STREAK}{" "}
                  <Text style={{ color: fireColor }}>
                    {currentStreak}{" "}
                    {currentStreak === 1 ? STRINGS.DAY : STRINGS.DAYS}
                  </Text>
                </Text>
              </AnimatedText>
              {/* Subtitle */}
              <AnimatedText animationKey={`subtitle-${personalBest}`}>
                <Text style={styles.subtitle}>
                  {personalBest > 0
                    ? STRINGS.SUBTITLE_PERSONAL_BEST(personalBest)
                    : STRINGS.SUBTITLE_BEGIN_TRACKING}
                </Text>
              </AnimatedText>
            </View>
          </View>
          {/* Encouragement */}
          <AnimatedText animationKey={`success-encourage-${currentStreak}`}>
            <Text style={[styles.encouragement, { color: colors.icon }]}>
              {encouragement}
            </Text>
          </AnimatedText>
          {/* Banner */}
          <ComeBackBanner />
        </View>
      );
    } else {
      const encouragement = getFailureMessage(true, streakData);

      return (
        <View
          style={[styles.container, { backgroundColor: colors.cardBackground }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: fireBg }]}>
              <IconSymbol name="flame.fill" size={32} color={fireColor} />
            </View>
            <View style={styles.titleContainer}>
              {/* Fail Title */}
              <AnimatedText animationKey="fail-title">
                <Text style={[styles.title, { color: mainTextColor }]}>
                  {STRINGS.TITLE_START_NEW_STREAK}
                </Text>
              </AnimatedText>
              {/* Subtitle */}
              <AnimatedText animationKey={`subtitle-${personalBest}`}>
                <Text style={styles.subtitle}>
                  {personalBest > 0
                    ? STRINGS.SUBTITLE_PERSONAL_BEST(personalBest)
                    : STRINGS.SUBTITLE_BEGIN_TRACKING}
                </Text>
              </AnimatedText>
            </View>
          </View>
          {/* Encouragement */}
          <AnimatedText
            animationKey={`fail-encourage-${hadNewPersonalBest(streakData)}`}
          >
            <Text style={[styles.encouragement, { color: colors.icon }]}>
              {encouragement}
            </Text>
          </AnimatedText>
          {/* Banner */}
          <ComeBackBanner />
        </View>
      );
    }
  }

  // CASE 2: Has pending days - show check-in interface
  const question = isYesterday(dateToAsk.date)
    ? STRINGS.QUESTION_YESTERDAY
    : STRINGS.QUESTION_ON_DATE(formatDate(dateToAsk.date));
  const questionAnimationKey = `question-${dateToAsk.date}`;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: fireBg }]}>
          <IconSymbol name="flame.fill" size={32} color={fireColor} />
        </View>
        <View style={styles.titleContainer}>
          {/* Title */}
          {hasActiveStreak ? (
            <AnimatedText animationKey={`streak-${currentStreak}`}>
              <Text style={[styles.title, { color: mainTextColor }]}>
                {STRINGS.TITLE_YOUR_STREAK}{" "}
                <Text style={{ color: fireColor }}>
                  {currentStreak}{" "}
                  {currentStreak === 1 ? STRINGS.DAY : STRINGS.DAYS}
                </Text>
              </Text>
            </AnimatedText>
          ) : (
            <AnimatedText animationKey="start-streak">
              <Text style={[styles.title, { color: mainTextColor }]}>
                {STRINGS.TITLE_START_STREAK}
              </Text>
            </AnimatedText>
          )}
          {/* Subtitle */}
          <AnimatedText animationKey={`subtitle-${personalBest}`}>
            <Text style={styles.subtitle}>
              {personalBest > 0
                ? STRINGS.SUBTITLE_PERSONAL_BEST(personalBest)
                : STRINGS.SUBTITLE_BEGIN_TRACKING}
            </Text>
          </AnimatedText>
        </View>
      </View>

      {/* If user is starting again after a fail */}
      {!hasActiveStreak && personalBest > 0 && (
        <AnimatedText
          animationKey={`start-again-${hadNewPersonalBest(streakData)}`}
        >
          <Text
            style={[
              styles.encouragement,
              { color: colors.icon, marginBottom: 10 },
            ]}
          >
            {getFailureMessage(false, streakData)}
          </Text>
        </AnimatedText>
      )}

      {/* Question */}
      <AnimatedText animationKey={questionAnimationKey}>
        <Text style={[styles.description, { color: colors.icon }]}>
          {question}
        </Text>
      </AnimatedText>

      {/* Buttons */}
      <CheckInButtons />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
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
});
