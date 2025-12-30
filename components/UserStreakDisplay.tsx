// components/streaks/UserStreakDisplay.tsx
import { useUserStreak } from "@/hooks/streak/useUserStreak";
import React from "react";
import { UserStreakBadge } from "./UserStreakBadge";

interface UserStreakDisplayProps {
  userId: string;
  size?: "small" | "medium";
  style?: any;
}

export function UserStreakDisplay({
  userId,
  size = "small",
  style,
}: UserStreakDisplayProps) {
  const { streak, loading } = useUserStreak(userId);

  // Don't render anything while loading or if error
  if (loading || streak <= 0) {
    return null;
  }

  return <UserStreakBadge streak={streak} size={size} style={style} />;
}

// For use in contexts where you're displaying multiple users at once
// This is more efficient as it batches the requests
interface MultiUserStreakDisplayProps {
  userId: string;
  streaks: Record<string, number>; // Pre-fetched streaks map
  size?: "small" | "medium";
  style?: any;
}

export function MultiUserStreakDisplay({
  userId,
  streaks,
  size = "small",
  style,
}: MultiUserStreakDisplayProps) {
  const streak = streaks[userId] || 0;

  if (streak <= 0) return null;

  return <UserStreakBadge streak={streak} size={size} style={style} />;
}
