import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { useThreads } from "@/hooks/useThreads";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SectionHeader } from "./MessageThreadsHeader";
import { ThreadItem } from "./ThreadItem";

interface MessageThreadsSectionProps {
  scrollY: any; // SharedValue<number>
  onScroll: (event: any) => void;
}

export function MessageThreadsSection({
  scrollY,
  onScroll,
}: MessageThreadsSectionProps) {
  const { colors } = useTheme();
  const { threads, loading, error } = useThreads();

  // Load accountability relationships
  const { mentor, mentees } = useAccountabilityRelationships();

  // Timer to refresh relative timestamps
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (loading) {
    return (
      <View style={styles.section}>
        <SectionHeader scrollY={scrollY} threadsCount={0} loading={true} />
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="clock"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            Loading your conversations...
          </ThemedText>
        </View>
      </View>
    );
  }

  // -----------------------------
  // ERROR STATE
  // -----------------------------
  if (error) {
    return (
      <View style={styles.section}>
        <SectionHeader scrollY={scrollY} threadsCount={0} error={error} />
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            {error}
          </ThemedText>
        </View>
      </View>
    );
  }

  // -----------------------------
  // BUILD PINNED SECTIONS
  // -----------------------------
  let mentorThread: any = null;
  const menteeThreads: any[] = [];
  const regularThreads: any[] = [];

  const menteeIds = new Set(mentees.map((m) => m.menteeUid));
  const mentorId = mentor?.mentorUid ?? null;

  threads.forEach((t) => {
    if (mentorId && t.otherUserId === mentorId) {
      mentorThread = t;
    } else if (menteeIds.has(t.otherUserId)) {
      menteeThreads.push(t);
    } else {
      regularThreads.push(t);
    }
  });

  return (
    <View style={styles.section}>
      <SectionHeader scrollY={scrollY} threadsCount={threads.length} />

      {/* -----------------------
          🔵 MENTOR SECTION
      ------------------------ */}
      {mentorThread && mentor && (
        <View style={{ marginBottom: 24 }}>
          <ThemedText
            type="captionMedium"
            style={{
              color: colors.textSecondary,
              marginBottom: 6,
              marginLeft: 4,
            }}
          >
            YOUR ACCOUNTABILITY PARTNER
          </ThemedText>

          <ThreadItem
            key={mentorThread.id}
            thread={mentorThread}
            colors={colors}
            now={now}
            relationshipData={{
              type: "mentor",
              id: mentor.id,
              streak: mentor.streak,
              checkInStatus: mentor.checkInStatus,
              timezone: mentor.mentorTimezone,
            }}
          />
        </View>
      )}

      {/* -----------------------
          🟢 MENTEES SECTION
      ------------------------ */}
      {menteeThreads.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <ThemedText
            type="captionMedium"
            style={{
              color: colors.textSecondary,
              marginBottom: 6,
              marginLeft: 4,
            }}
          >
            PEOPLE YOU SUPPORT
          </ThemedText>

          {menteeThreads.map((t) => {
            // Find the mentee relationship for this thread
            const menteeRelationship = mentees.find(
              (m) => m.menteeUid === t.otherUserId
            );

            return (
              <ThreadItem
                key={t.id}
                thread={t}
                colors={colors}
                now={now}
                relationshipData={
                  menteeRelationship
                    ? {
                        type: "mentee",
                        id: menteeRelationship.id,
                        streak: menteeRelationship.streak,
                        checkInStatus: menteeRelationship.checkInStatus,
                        timezone: menteeRelationship.menteeTimezone,
                      }
                    : undefined
                }
              />
            );
          })}
        </View>
      )}

      {/* -----------------------
          🟣 REGULAR THREADS
      ------------------------ */}
      {regularThreads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="message"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            No message threads yet
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.emptySubtext, { color: colors.textSecondary }]}
          >
            When you start a chat with someone, or someone starts a chat with
            you, it will appear here
          </ThemedText>
        </View>
      ) : (
        <View style={styles.threadsList}>
          <ThemedText
            type="captionMedium"
            style={{
              color: colors.textSecondary,
              marginBottom: 6,
              marginLeft: 4,
            }}
          >
            CONVERSATIONS
          </ThemedText>

          {regularThreads.map((t) => (
            <ThreadItem key={t.id} thread={t} colors={colors} now={now} />
          ))}
        </View>
      )}
    </View>
  );
}

// -----------------------------
// STYLES
// -----------------------------

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.8,
  },
  emptySubtext: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 18,
  },
  threadsList: {
    gap: 8,
  },
});
