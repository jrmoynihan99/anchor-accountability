// components/messages/PendingPleasSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { usePendingPleas } from "@/hooks/plea/usePendingPleas";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { ButtonModalTransitionBridge } from "../../ButtonModalTransitionBridge";
import { PleaCard } from "./PleaCard";
import { PleaResponseModal } from "./PleaResponseModal";

const PREVIEW_LIMIT = 3;

// --- Animation wrapper for plea entry ---
function AnimatedPleaItem({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown}
      layout={LinearTransition.duration(300)}
      style={{ width: "100%" }}
    >
      {children}
    </Animated.View>
  );
}

export function PendingPleasSection() {
  const { colors } = useTheme();
  const { pendingPleas, loading, error } = usePendingPleas();

  // Add a single timer here
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Store just the id, not the object!
  const [selectedPleaId, setSelectedPleaId] = useState<string | null>(null);
  const selectedPlea =
    pendingPleas.find((p) => p.id === selectedPleaId) || null;

  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/plea-view-all");
  };

  if (loading) {
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader colors={colors} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <ThemedText
            type="caption"
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Loading recent support requests...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader colors={colors} />
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={24}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="caption"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            Unable to load requests. Please try again.
          </ThemedText>
        </View>
      </View>
    );
  }

  const displayedPleas = pendingPleas.slice(0, PREVIEW_LIMIT);
  const hasMorePleas = pendingPleas.length > PREVIEW_LIMIT;

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader colors={colors} />

      {pendingPleas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="megaphone"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            No recent support requests right now
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.emptySubtext, { color: colors.textSecondary }]}
          >
            When someone reaches out for help, you'll see their request here
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.pleasContainer}>
            {displayedPleas.map((plea, index) => (
              <AnimatedPleaItem key={plea.id}>
                <ButtonModalTransitionBridge
                  buttonBorderRadius={16}
                  modalBorderRadius={28}
                  modalWidthPercent={0.95}
                  modalHeightPercent={0.72}
                >
                  {({
                    open,
                    close,
                    isModalVisible,
                    progress,
                    buttonAnimatedStyle,
                    modalAnimatedStyle,
                    buttonRef,
                    handlePressIn,
                    handlePressOut,
                  }) => (
                    <>
                      <PleaCard
                        plea={plea}
                        now={now}
                        index={index}
                        buttonRef={buttonRef}
                        style={buttonAnimatedStyle}
                        onPress={() => {
                          setSelectedPleaId(plea.id);
                          open();
                        }}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                      />
                      <PleaResponseModal
                        isVisible={isModalVisible}
                        progress={progress}
                        modalAnimatedStyle={modalAnimatedStyle}
                        close={close}
                        plea={selectedPlea}
                        now={now}
                      />
                    </>
                  )}
                </ButtonModalTransitionBridge>
              </AnimatedPleaItem>
            ))}
          </View>

          {hasMorePleas && (
            <TouchableOpacity
              style={[
                styles.viewAllButton,
                { backgroundColor: colors.buttonBackground },
              ]}
              onPress={handleViewAll}
              activeOpacity={0.85}
            >
              <IconSymbol
                name="list.bullet"
                color={colors.white}
                size={18}
                style={{ marginRight: 8 }}
              />
              <ThemedText
                type="button"
                style={[styles.viewAllText, { color: colors.white }]}
              >
                View All
              </ThemedText>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// Helper for urgency
function getHoursAgo(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

function SectionHeader({ colors }: { colors: any; totalCount?: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol name="megaphone" size={20} color={colors.icon} />
        </View>
        <View style={styles.headerText}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Recent Support Requests
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            <ThemedText
              type="caption"
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              People who need encouragement
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// --- Flat, no card, no background, no shadow styles ---
const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    lineHeight: 22,
  },
  headerSubtitle: {
    marginTop: 1,
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    opacity: 0.8,
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
  pleasContainer: {
    gap: 12,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: "center",
    marginTop: 16,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  viewAllText: {},
});
