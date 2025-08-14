export type PrayerStep = "intro" | "breathing" | "reflection" | "complete";

export interface PrayerStepConfig {
  title: string;
  subtitle: string;
  content: string;
  duration: number | null;
}

export const PRAYER_STEPS: Record<PrayerStep, PrayerStepConfig> = {
  intro: {
    title: "Guided Prayer",
    subtitle: "Find peace and strength",
    content:
      "Take a moment to center yourself. Let's begin this journey together.",
    duration: null,
  },
  breathing: {
    title: "Breathe Deeply",
    subtitle: "60 seconds",
    content:
      "Focus on your breath. Inhale slowly for 4 counts, hold for 4, then exhale for 6. Feel God's presence with each breath.",
    duration: 60,
  },
  reflection: {
    title: "Prayer & Reflection",
    subtitle: "60 seconds",
    content:
      "Lord, grant me strength to overcome temptation. Help me find peace in Your presence and wisdom in Your guidance. I trust in Your love and forgiveness.",
    duration: 60,
  },
  complete: {
    title: "Prayer Complete",
    subtitle: "Well done",
    content:
      "May this moment of prayer stay with you throughout your day. Remember, you are loved and supported.",
    duration: null,
  },
};

export const PRAYER_STEP_ORDER: PrayerStep[] = [
  "intro",
  "breathing",
  "reflection",
  "complete",
];

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getPreviousStep = (currentStep: PrayerStep): PrayerStep | null => {
  const currentIndex = PRAYER_STEP_ORDER.indexOf(currentStep);
  return currentIndex > 0 ? PRAYER_STEP_ORDER[currentIndex - 1] : null;
};

export const getNextStep = (currentStep: PrayerStep): PrayerStep | null => {
  const currentIndex = PRAYER_STEP_ORDER.indexOf(currentStep);
  return currentIndex < PRAYER_STEP_ORDER.length - 1
    ? PRAYER_STEP_ORDER[currentIndex + 1]
    : null;
};
