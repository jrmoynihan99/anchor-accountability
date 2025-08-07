// ================== STRINGS CONFIGURATION ==================
export const STRINGS = {
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
export interface StreakEntry {
  date: string;
  status: "success" | "fail" | "pending";
}

// ================== DATE UTILITY FUNCTIONS ==================
export const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
};

export const isYesterday = (dateStr: string) => dateStr === getYesterday();

export const isToday = (dateStr: string) => {
  const today = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  const checkDate = new Date(year, month - 1, day);
  return today.toDateString() === checkDate.toDateString();
};

export const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// ================== STREAK CALCULATION FUNCTIONS ==================
export const getCurrentStreak = (streakData: StreakEntry[]) => {
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

export const getPersonalBest = (streakData: StreakEntry[]) => {
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

export const hadNewPersonalBest = (streakData: StreakEntry[]) => {
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

export const getDateToAskAbout = (streakData: StreakEntry[]) => {
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

export const getFailureMessage = (
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
