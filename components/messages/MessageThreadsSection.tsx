import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/context/ThemeContext";
import { useThreads } from "@/hooks/useThreads";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { DeclinedInviteItem } from "../DeclinedInviteItem"; // ✅ NEW
import { ReceivedInviteItem } from "../ReceivedInviteItem";
import { SentInviteItem } from "../SentInviteItem";
import { SectionHeader } from "./MessageThreadsHeader";
import { ThreadItem } from "./ThreadItem";

interface MessageThreadsSectionProps {
  scrollY: any;
  onScroll: (event: any) => void;
}

export function MessageThreadsSection({
  scrollY,
  onScroll,
}: MessageThreadsSectionProps) {
  const { colors } = useTheme();
  const { threads, loading, error } = useThreads();

  // ✅ Add declinedInvites to destructuring
  const { mentor, mentees, receivedInvites, sentInvites, declinedInvites } =
    useAccountability();

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
  // BUILD SECTIONS
  // -----------------------------
  let mentorThread: any = null;
  const menteeThreads: any[] = [];
  const regularThreads: any[] = [];

  const menteeIds = new Set(mentees.map((m) => m.menteeUid));
  const mentorId = mentor?.mentorUid ?? null;

  // Don't filter out pending invite threads anymore - let them stay in regular threads
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
          🟡 RECEIVED INVITES SECTION
      ------------------------ */}
      {receivedInvites.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <ThemedText
            type="captionMedium"
            style={{
              color: colors.textSecondary,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            INCOMING ANCHOR PARTNER INVITES
          </ThemedText>

          {receivedInvites.map((invite) => {
            const thread = threads.find(
              (t) => t.otherUserId === invite.menteeUid
            );

            if (!thread) return null;

            return (
              <ReceivedInviteItem
                key={invite.id}
                userName={thread.otherUserName}
                userId={thread.otherUserId}
                threadId={thread.id}
                inviteId={invite.id}
                colors={colors}
              />
            );
          })}
        </View>
      )}

      {/* -----------------------
          🟠 SENT INVITES SECTION (includes declined)
      ------------------------ */}
      {(sentInvites.length > 0 || declinedInvites.length > 0) && (
        <View style={{ marginBottom: 18 }}>
          <ThemedText
            type="captionMedium"
            style={{
              color: colors.textSecondary,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            ANCHOR PARTNER INVITES SENT
          </ThemedText>

          {/* ✅ Show declined invites first */}
          {declinedInvites.map((invite) => {
            const thread = threads.find(
              (t) => t.otherUserId === invite.mentorUid
            );

            if (!thread) return null;

            return (
              <DeclinedInviteItem
                key={invite.id}
                userName={thread.otherUserName}
                userId={thread.otherUserId}
                threadId={thread.id}
                inviteId={invite.id}
                colors={colors}
              />
            );
          })}

          {/* Show sent invites after declined */}
          {sentInvites.map((invite) => {
            const thread = threads.find(
              (t) => t.otherUserId === invite.mentorUid
            );

            if (!thread) return null;

            return (
              <SentInviteItem
                key={invite.id}
                userName={thread.otherUserName}
                userId={thread.otherUserId}
                threadId={thread.id}
                inviteId={invite.id}
                colors={colors}
              />
            );
          })}
        </View>
      )}

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
            YOUR ANCHOR PARTNER
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
