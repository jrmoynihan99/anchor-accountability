// utils/accountabilityUtils.ts

// ========================================
// CHECK-IN STATUS INTERFACE & CALCULATION
// ========================================
export interface CheckInStatus {
  text: string;
  icon: string;
  colorKey: "success" | "error" | "textSecondary";
  isOverdue: boolean;
  overdueText: string | null;
  hasCheckedInToday: boolean;
}

export function calculateCheckInStatus(
  lastCheckIn: string | null
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

  const now = new Date();
  const checkInDate = new Date(lastCheckIn);
  const diffHours = Math.floor(
    (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
  );

  // Helper to format time ago
  const formatTimeAgo = (diffHours: number) => {
    const days = Math.floor(diffHours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months}mo ago`;
    if (weeks > 0) return `${weeks}wk ago`;
    return `${days}d ago`;
  };

  if (diffHours < 24) {
    return {
      text: "Checked in today",
      icon: "checkmark.circle.fill",
      colorKey: "success",
      isOverdue: false,
      overdueText: null,
      hasCheckedInToday: true,
    };
  }

  if (diffHours < 48) {
    return {
      text: "Last check-in yesterday",
      icon: "exclamationmark.triangle.fill",
      colorKey: "textSecondary",
      isOverdue: true,
      overdueText: "Yesterday",
      hasCheckedInToday: false,
    };
  }

  return {
    text: "Overdue check-in",
    icon: "xmark.circle.fill",
    colorKey: "error",
    isOverdue: true,
    overdueText: formatTimeAgo(diffHours),
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

export function formatDate(dateString: string): string {
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day); // Month is 0-indexed

  const today = new Date();
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

export function isToday(dateInput: Date | string): boolean {
  const today = new Date();
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
