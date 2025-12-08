// components/morphing/accountability/recent-check-ins/calendarUtils.ts

/**
 * Generate calendar grid for a given month
 * Returns array of date strings (YYYY-MM-DD) or null for empty cells
 */
export function generateCalendar(currentMonth: Date): (string | null)[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const calendar: (string | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendar.push(null);
  }

  // Add all days in month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = formatDateToYYYYMMDD(date);
    calendar.push(dateString);
  }

  return calendar;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string (YYYY-MM-DD) is in the future
 * Uses date-only comparison to avoid timezone issues
 */
export function isDateInFuture(dateString: string): boolean {
  // Parse the date string (YYYY-MM-DD) - same pattern as accountabilityUtils
  const [year, month, day] = dateString.split("-").map(Number);
  const checkDate = new Date(year, month - 1, day); // Month is 0-indexed

  const today = new Date();
  const todayDateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const checkDateOnly = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate()
  );

  return checkDateOnly.getTime() > todayDateOnly.getTime();
}

/**
 * Format month for display
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
