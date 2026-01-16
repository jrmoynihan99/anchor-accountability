import { MessageInput } from "@/components/MessageInput";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { TriggerType } from "@/hooks/accountability/useCheckIns";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CheckInStatus, formatDate } from "./accountabilityUtils";

interface CheckInSectionProps {
  checkInStatus: CheckInStatus;
  onSubmit: (
    temptationLevel: number,
    triggers: TriggerType[] | undefined,
    note: string
  ) => void;
  selectedDate?: string | null; // YYYY-MM-DD format for retroactive fill
}

const TRIGGER_OPTIONS: { id: TriggerType; label: string; icon: string }[] = [
  { id: "social_media", label: "Social Media / Internet", icon: "globe" },
  { id: "loneliness", label: "Loneliness / Isolation", icon: "person.fill" },
  { id: "stress", label: "Stress / Anxiety", icon: "exclamationmark.triangle" },
  { id: "boredom", label: "Boredom / Laziness", icon: "bed.double.fill" },
  { id: "alcohol", label: "Alcohol / Substances", icon: "wineglass" },
  { id: "attraction", label: "Seeing Attractive People", icon: "eye.fill" },
  { id: "other", label: "Other", icon: "ellipsis.circle" },
];

export const CheckInSection = React.memo(function CheckInSection({
  checkInStatus,
  onSubmit,
  selectedDate = null,
}: CheckInSectionProps) {
  const { colors } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<TriggerType[]>([]);
  const [checkInNote, setCheckInNote] = useState("");

  // If we're filling retroactively, show different messaging
  const isRetroactive = selectedDate !== null;
  const displayDate = isRetroactive ? formatDate(selectedDate) : null;

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
    // Reset triggers when changing level
    if (level < 3) {
      setSelectedTriggers([]);
    }
  };

  const handleTriggerToggle = (trigger: TriggerType) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleSubmit = () => {
    if (selectedLevel === null) return;

    const triggers =
      selectedLevel >= 3 && selectedTriggers.length > 0
        ? selectedTriggers
        : undefined;

    onSubmit(selectedLevel, triggers, checkInNote);

    // Reset form
    setSelectedLevel(null);
    setSelectedTriggers([]);
    setCheckInNote("");
  };

  const getLevelColor = (level: number): string => {
    if (level <= 2) return colors.success || "#34C759";
    if (level <= 4) return colors.warning || "#FF9500";
    return colors.error || "#FF3B30";
  };

  const getLevelZone = (level: number): string => {
    if (level <= 2) return "Low Temptation";
    if (level <= 4) return "Higher Temptation";
    return "Relapsed";
  };

  const getCelebrationMessage = (level: number): string => {
    switch (level) {
      case 1:
        return "Great day - keep building momentum!";
      case 2:
        return "You stayed strong today. Keep it up!";
      case 3:
        return "You faced medium temptation and won.";
      case 4:
        return "You fought hard temptation today and WON!";
      case 5:
        return "Recovery isn't linear. Your partner is here for you.";
      default:
        return "Check-in complete!";
    }
  };

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.modalCardBackground,
          borderColor: colors.modalCardBorder,
        },
      ]}
    >
      {/* Section Header with Icon */}
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIconCircle,
            { backgroundColor: `${colors.iconCircleBackground}50` },
          ]}
        >
          <IconSymbol name="checkmark.circle" size={16} color={colors.icon} />
        </View>
        <View style={styles.sectionHeaderText}>
          <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
            {isRetroactive
              ? `Add Check-In for ${displayDate}`
              : "Daily Check-In"}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {isRetroactive
              ? "How was your battle with temptation?"
              : checkInStatus.hasCheckedInToday
              ? "You've checked in today"
              : "How was your battle with temptation today?"}
          </ThemedText>
        </View>
      </View>

      {checkInStatus.hasCheckedInToday && !isRetroactive ? (
        /* Already Checked In State (only for today) */
        <View style={styles.checkedInContainer}>
          <View
            style={[
              styles.checkedInBadge,
              { backgroundColor: `${colors.success}20` },
            ]}
          >
            <IconSymbol
              name="checkmark.circle.fill"
              size={48}
              color={colors.success}
            />
          </View>
          <ThemedText
            type="subtitleMedium"
            style={{ color: colors.text, textAlign: "center" }}
          >
            Check-in complete!
          </ThemedText>
          <ThemedText
            type="caption"
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Come back tomorrow for your next check-in
          </ThemedText>
        </View>
      ) : (
        <>
          {/* Temptation Level Grid */}
          <View style={{ marginTop: 16 }}>
            <View style={styles.levelGrid}>
              {/* Single Row: 1-5 */}
              <View style={styles.levelRow}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      {
                        backgroundColor:
                          selectedLevel === level
                            ? getLevelColor(level)
                            : colors.cardBackground,
                        borderColor:
                          selectedLevel === level
                            ? getLevelColor(level)
                            : colors.border,
                      },
                    ]}
                    onPress={() => handleLevelSelect(level)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      type="subtitleSemibold"
                      style={{
                        color:
                          selectedLevel === level ? colors.white : colors.text,
                      }}
                    >
                      {level}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <LegendItem
                color={colors.success || "#34C759"}
                label="Low Temptation (1-2)"
                colors={colors}
              />
              <LegendItem
                color={colors.warning || "#FF9500"}
                label="Higher Temptation (3-4)"
                colors={colors}
              />
              <LegendItem
                color={colors.error || "#FF3B30"}
                label="Relapsed (5)"
                colors={colors}
              />
            </View>
          </View>

          {/* Show selected level confirmation */}
          {selectedLevel !== null && (
            <View
              style={[
                styles.selectedLevelBanner,
                {
                  backgroundColor: `${getLevelColor(selectedLevel)}20`,
                  borderColor: `${getLevelColor(selectedLevel)}40`,
                },
              ]}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                color={getLevelColor(selectedLevel)}
              />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <ThemedText
                  type="bodyMedium"
                  style={{
                    color: colors.text,
                  }}
                >
                  {getLevelZone(selectedLevel)}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {getCelebrationMessage(selectedLevel)}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Triggers Section (only if level >= 3) */}
          {selectedLevel !== null && selectedLevel >= 3 && (
            <View style={{ marginTop: 16 }}>
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.text, marginBottom: 12 }}
              >
                What triggered this? (Select all that apply)
              </ThemedText>

              <View style={styles.triggersGrid}>
                {TRIGGER_OPTIONS.map((trigger) => (
                  <TouchableOpacity
                    key={trigger.id}
                    style={[
                      styles.triggerButton,
                      {
                        backgroundColor: selectedTriggers.includes(trigger.id)
                          ? `${colors.buttonBackground}20`
                          : colors.cardBackground,
                        borderColor: selectedTriggers.includes(trigger.id)
                          ? colors.buttonBackground
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleTriggerToggle(trigger.id)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol
                      name={trigger.icon}
                      size={18}
                      color={
                        selectedTriggers.includes(trigger.id)
                          ? colors.buttonBackground
                          : colors.textSecondary
                      }
                    />
                    <ThemedText
                      type="caption"
                      style={{
                        color: selectedTriggers.includes(trigger.id)
                          ? colors.text
                          : colors.textSecondary,
                        marginLeft: 8,
                      }}
                    >
                      {trigger.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Optional Note Input (always show if level selected) */}
          {selectedLevel !== null && (
            <View style={{ marginTop: 16 }}>
              <MessageInput
                value={checkInNote}
                onChangeText={setCheckInNote}
                placeholder="Add a note (optional)..."
                maxLength={200}
                minHeight={60}
                showBorder={false}
              />
            </View>
          )}

          {/* Submit Button */}
          {selectedLevel !== null && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.buttonBackground },
              ]}
              onPress={handleSubmit}
            >
              <ThemedText type="button" style={{ color: colors.white }}>
                Submit Check-In
              </ThemedText>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
});

/* ---------- Helper Components ---------- */

function LegendItem({
  color,
  label,
  colors,
}: {
  color: string;
  label: string;
  colors: any;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
          },
        ]}
      />
      <ThemedText
        type="caption"
        style={{ color: colors.textSecondary, marginLeft: 6 }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  levelGrid: {
    gap: 8,
  },
  levelRow: {
    flexDirection: "row",
    gap: 8,
  },
  levelButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  legend: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectedLevelBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
  },
  triggersGrid: {
    gap: 8,
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
  },
  submitButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedInContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  checkedInBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
});
