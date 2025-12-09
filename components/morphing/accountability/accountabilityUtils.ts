// utils/accountabilityUtils.ts

// ========================================
// CHECK-IN STATUS INTERFACE & CALCULATION
// ========================================
export interface CheckInStatus {
  text: string;
  icon: string;
  colorKey: "success" | "error" | "textSecondary" | "achievement";
  isOverdue: boolean;
  overdueText: string | null;
  hasCheckedInToday: boolean;
}

export function calculateCheckInStatus(
  lastCheckIn: string | null,
  userTimezone?: string
): CheckInStatus {
  if (!lastCheckIn) {
    return {
      text: "Not checked in yet",
      icon: "clock.fill",
      colorKey: "textSecondary",
      isOverdue: false,
      overdueText: null,
      hasCheckedInToday: false,
    };
  }

  // =============================
  // Get TODAY in mentee timezone
  // =============================
  let today: Date;
  if (userTimezone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(new Date());
    const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
    const month =
      parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;
    const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");

    today = new Date(year, month, day);
  } else {
    today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  // Parse lastCheckIn
  const [y, m, d] = lastCheckIn.split("-").map(Number);
  const checkInDate = new Date(y, m - 1, d);

  // Build yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // =============================
  // Today?
  // =============================
  const isToday =
    checkInDate.getFullYear() === today.getFullYear() &&
    checkInDate.getMonth() === today.getMonth() &&
    checkInDate.getDate() === today.getDate();

  if (isToday) {
    return {
      text: "Checked in today",
      icon: "checkmark.circle.fill",
      colorKey: "success",
      isOverdue: false,
      overdueText: null,
      hasCheckedInToday: true,
    };
  }

  // =============================
  // Yesterday?
  // =============================
  const isYesterday =
    checkInDate.getFullYear() === yesterday.getFullYear() &&
    checkInDate.getMonth() === yesterday.getMonth() &&
    checkInDate.getDate() === yesterday.getDate();

  if (isYesterday) {
    return {
      text: "Last check-in yesterday",
      icon: "exclamationmark.triangle.fill",
      colorKey: "textSecondary", // stays yellow
      isOverdue: true,
      overdueText: "",
      hasCheckedInToday: false,
    };
  }

  // =============================
  // Overdue — compute days ago
  // =============================
  const diffMs = today.getTime() - checkInDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // NEW CASE: Missed check-in yesterday (2 days since)
  if (diffDays === 2) {
    return {
      text: "Missed check-in yesterday",
      icon: "exclamationmark.triangle.fill",
      colorKey: "achievement", // yellow
      isOverdue: true,
      overdueText: "",
      hasCheckedInToday: false,
    };
  }

  // Standard overdue case
  return {
    text: "Overdue check-in",
    icon: "xmark.circle.fill",
    colorKey: "error",
    isOverdue: true,
    overdueText: `${diffDays}d ago`,
    hasCheckedInToday: false,
  };
}

// ========================================
// CHECK-IN RECORD STATUS HELPERS
// ========================================
export function getStatusIcon(status: string): string {
  switch (status) {
    case "great":
      return "checkmark.circle.fill";
    case "struggling":
      return "exclamationmark.triangle.fill";
    case "support":
      return "xmark.circle.fill";
    default:
      return "clock.fill";
  }
}

export function getStatusColor(status: string, colors: any): string {
  switch (status) {
    case "great":
      return colors.success;
    case "struggling":
      return colors.textSecondary;
    case "support":
      return colors.error;
    default:
      return colors.textSecondary;
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "great":
      return "Doing Great!";
    case "struggling":
      return "Struggling";
    case "support":
      return "Needs Support";
    default:
      return "Unknown";
  }
}

// ========================================
// DATE FORMATTING UTILITIES
// ========================================
export function formatCheckInTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }
}

/**
 * Format a date string (YYYY-MM-DD) as "Today", "Yesterday", or full date
 * @param dateString - Date in YYYY-MM-DD format
 * @param userTimezone - Optional timezone (e.g., "America/New_York"). If not provided, uses device local time.
 */
export function formatDate(dateString: string, userTimezone?: string): string {
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Get "today" in the appropriate timezone
  let today: Date;
  if (userTimezone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(new Date());
    const todayYear = parseInt(
      parts.find((p) => p.type === "year")?.value || "0"
    );
    const todayMonth =
      parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;
    const todayDay = parseInt(
      parts.find((p) => p.type === "day")?.value || "0"
    );

    today = new Date(todayYear, todayMonth, todayDay);
  } else {
    today = new Date();
  }

  const todayDateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const yesterday = new Date(todayDateOnly);
  yesterday.setDate(yesterday.getDate() - 1);

  const checkDateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (checkDateOnly.getTime() === todayDateOnly.getTime()) {
    return "Today";
  } else if (checkDateOnly.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
}

export function isToday(
  dateInput: Date | string,
  userTimezone?: string
): boolean {
  // Get "today" in the appropriate timezone
  let today: Date;
  if (userTimezone) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(new Date());
    const todayYear = parseInt(
      parts.find((p) => p.type === "year")?.value || "0"
    );
    const todayMonth =
      parseInt(parts.find((p) => p.type === "month")?.value || "0") - 1;
    const todayDay = parseInt(
      parts.find((p) => p.type === "day")?.value || "0"
    );

    today = new Date(todayYear, todayMonth, todayDay);
  } else {
    today = new Date();
  }

  let checkDate: Date;

  if (typeof dateInput === "string") {
    const [year, month, day] = dateInput.split("-").map(Number);
    checkDate = new Date(year, month - 1, day);
  } else {
    checkDate = dateInput;
  }

  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

export function getLocalTimeForTimezone(timezone?: string): string | null {
  if (!timezone) return null;

  try {
    const now = new Date();

    // Time (e.g., "3:41 AM")
    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(now);

    // Date (e.g., "Dec 10")
    const date = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "short",
      day: "numeric",
    }).format(now);

    return `${time}, ${date}`;
  } catch {
    return null;
  }
}
