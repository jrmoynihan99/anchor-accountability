import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CheckInStatus } from "../../accountability/accountabilityUtils";

interface MentorCardCompactContentProps {
  mentorUid: string;
  streak: number;
  checkInStatus: CheckInStatus;
  mentorTimezone?: string;
  showExpandIcon?: boolean;
  onCheckIn?: () => void;
  onMessage?: () => void;
  // Add these new props for proper measurement
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function MentorCardCompactContent({
  mentorUid,
  checkInStatus,
  mentorTimezone,
  showExpandIcon = true,
  onCheckIn,
  onMessage,
  onPressIn,
  onPressOut,
}: MentorCardCompactContentProps) {
  const { colors } = useTheme();

  const ExpandIcon = () => {
    if (!showExpandIcon) return null;
    return (
      <IconSymbol
        name="arrow.up.left.and.arrow.down.right"
        size={18}
        color={colors.textSecondary}
        style={styles.expandIcon}
      />
    );
  };

  // Get the actual color from the theme
  const statusColor = colors[checkInStatus.colorKey];

  const handleCheckIn = () => {
    // Measure the card position, then trigger check-in
    if (onPressIn && onPressOut) {
      onPressIn();
      onPressOut();
      onCheckIn?.();
    } else {
      // Fallback if no measurement props
      onCheckIn?.();
    }
  };

  return (
    <View style={{ position: "relative" }}>
      <ExpandIcon />

      {/* ----- HEADER (matching StreakCard style exactly) ----- */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol
            name="person.2.fill"
            size={32}
            color={colors.buttonBackground}
          />
        </View>

        <View style={styles.titleContainer}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Accountability Partner
          </ThemedText>
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
            Check in with your partner
          </ThemedText>
        </View>
      </View>

      {/* ----- CHECK-IN STATUS (icon + text) ----- */}
      <View style={styles.statusSection}>
        <IconSymbol
          name={checkInStatus.icon}
          size={14}
          color={statusColor}
          style={{ marginRight: 6 }}
        />
        <ThemedText
          type="captionMedium"
          style={[
            styles.statusText,
            { color: statusColor, opacity: 0.95, lineHeight: 22 },
          ]}
        >
          {checkInStatus.isOverdue && checkInStatus.overdueText
            ? `${checkInStatus.text} (${checkInStatus.overdueText})`
            : checkInStatus.text}
        </ThemedText>
      </View>

      {/* ----- ACTION BUTTONS ----- */}
      <View style={styles.buttonRow}>
        {/* CHECK IN BUTTON (active or disabled) */}
        {checkInStatus.hasCheckedInToday ? (
          <View
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.bannerBackground,
                borderColor: colors.bannerBorder,
                borderWidth: 1,
              },
            ]}
            pointerEvents="none"
          >
            <IconSymbol
              name="checkmark.circle"
              color={colors.textSecondary}
              size={18}
              style={{ marginRight: 6, opacity: 0.7 }}
            />
            <ThemedText
              type="button"
              style={{
                color: colors.textSecondary,
                opacity: 0.8,
              }}
            >
              Checked In
            </ThemedText>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.buttonBackground },
            ]}
            onPress={handleCheckIn}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="checkmark.circle.fill"
              color={colors.white}
              size={18}
              style={{ marginRight: 6 }}
            />
            <ThemedText type="button" style={{ color: colors.white }}>
              Check In
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* MESSAGE BUTTON */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: `${colors.buttonBackground}30`,
              borderWidth: 1,
              borderColor: colors.buttonBackground,
            },
          ]}
          onPress={onMessage}
          activeOpacity={0.85}
        >
          <IconSymbol
            name="message.fill"
            color={colors.buttonBackground}
            size={18}
            style={{ marginRight: 6 }}
          />
          <ThemedText type="button" style={{ color: colors.buttonBackground }}>
            Message
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
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
    lineHeight: 24,
  },
  subtitle: {
    // Typography handled by ThemedText
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  statusText: {
    // Typography handled by ThemedText
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
  },
});
