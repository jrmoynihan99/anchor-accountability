// components/morphing/message-thread/accountability/invite-views/InviteRespondedView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { StyleSheet, View } from "react-native";

interface InviteRespondedViewProps {
  colors: any;
  type: "accepted" | "declined";
  threadName: string;
}

export function InviteRespondedView({
  colors,
  type,
  threadName,
}: InviteRespondedViewProps) {
  const isAccepted = type === "accepted";

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isAccepted
              ? `${colors.success || "#34C759"}20`
              : `${colors.textSecondary}20`,
          },
        ]}
      >
        <IconSymbol
          name={isAccepted ? "checkmark.circle.fill" : "xmark.circle.fill"}
          size={48}
          color={
            isAccepted ? colors.success || "#34C759" : colors.textSecondary
          }
        />
      </View>
      <ThemedText
        type="title"
        style={[styles.text, { color: colors.text, marginTop: 20 }]}
      >
        {isAccepted ? "You're now their Anchor Partner" : "Invite declined"}
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.subtext, { color: colors.textSecondary, marginTop: 8 }]}
      >
        {isAccepted
          ? `You'll start receiving daily check-ins from ${threadName}.`
          : `${threadName} has been notified.`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 22,
  },
  subtext: {
    textAlign: "center",
    opacity: 0.8,
    fontSize: 16,
    lineHeight: 22,
  },
});
