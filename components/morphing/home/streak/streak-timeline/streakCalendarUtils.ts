// components/morphing/accountability/streak-timeline/streakCalendarUtils.ts
import { getLocalDateString } from "../streakUtils";

/**
 * Generate a calendar grid for the given month.
 * Returns an array of 35-42 elements (5-6 weeks).
 * Each element is either a date string (YYYY-MM-DD) or null (empty cell).
 */
export function generateCalendar(month: Date): (string | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  // First day of the month
  const firstDay = new Date(year, monthIndex, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Last day of the month
  const lastDay = new Date(year, monthIndex + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Build the grid
  const grid: (string | null)[] = [];

  // Empty cells before the first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    grid.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(monthIndex + 1).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    grid.push(dateString);
  }

  // Fill remaining cells to complete the last week
  while (grid.length % 7 !== 0) {
    grid.push(null);
  }

  return grid;
}

/**
 * Format month and year for display (e.g., "January 2025")
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/**
 * Check if a date string is in the future (local time)
 */
export function isDateInFuture(dateString: string): boolean {
  const today = getLocalDateString(0);
  return dateString > today;
}
