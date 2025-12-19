// components/messages/MyReachOutsSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { useMyReachOuts } from "@/hooks/useMyReachOuts";
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
import { MyReachOutCard, MyReachOutData } from "./MyReachOutCard";
import { MyReachOutModal } from "./MyReachOutModal";

const PREVIEW_LIMIT = 3; // Only show 3 reach outs on main messages screen

// --- Animation wrapper for reach-out entry ---
function AnimatedReachOutItem({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeInDown}
      layout={LinearTransition.duration(250)}
      style={{ width: "100%" }}
    >
      {children}
    </Animated.View>
  );
}

export function MyReachOutsSection() {
  const { colors } = useTheme();
  const { myReachOuts, loading, error } = useMyReachOuts();

  // Timer for live "time ago" updates
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // State for which reach out is open in modal
  const [selectedReachOut, setSelectedReachOut] =
    useState<MyReachOutData | null>(null);

  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/my-reachouts-all");
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
            Loading your reach outs...
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
            Unable to load your reach outs. Please try again.
          </ThemedText>
        </View>
      </View>
    );
  }

  const displayedReachOuts = myReachOuts.slice(0, PREVIEW_LIMIT);
  const hasMoreReachOuts = myReachOuts.length > PREVIEW_LIMIT;

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader colors={colors} totalCount={myReachOuts.length} />

      {myReachOuts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="heart"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            You haven't reached out yet
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.emptySubtext, { color: colors.textSecondary }]}
          >
            When you need support, reach out using the shield button below
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.reachOutsContainer}>
            {displayedReachOuts.map((reachOut, index) => (
              <AnimatedReachOutItem key={reachOut.id}>
                <ButtonModalTransitionBridge
                  buttonBorderRadius={16}
                  modalBorderRadius={28}
                  modalWidthPercent={0.95}
                  modalHeightPercent={0.7}
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
                      <MyReachOutCard
                        reachOut={reachOut}
                        index={index}
                        buttonRef={buttonRef}
                        style={buttonAnimatedStyle}
                        now={now}
                        onPress={() => {
                          setSelectedReachOut(reachOut);
                          open();
                        }}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                      />
                      <MyReachOutModal
                        isVisible={isModalVisible}
                        progress={progress}
                        modalAnimatedStyle={modalAnimatedStyle}
                        close={close}
                        reachOut={
                          myReachOuts.find(
                            (r) => r.id === selectedReachOut?.id
                          ) ?? selectedReachOut
                        }
                        now={now}
                      />
                    </>
                  )}
                </ButtonModalTransitionBridge>
              </AnimatedReachOutItem>
            ))}
          </View>

          {hasMoreReachOuts && (
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
                View All ({myReachOuts.length})
              </ThemedText>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

function SectionHeader({
  colors,
  totalCount,
}: {
  colors: any;
  totalCount?: number;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol name="paperplane" size={20} color={colors.icon} />
        </View>
        <View style={styles.headerText}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            My Support Requests
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {totalCount !== undefined
              ? `${totalCount} ${
                  totalCount === 1 ? "request" : "requests"
                } for support`
              : "Your requests for support"}
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
  reachOutsContainer: {
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
  viewAllText: {
    // Typography.styles.button handled by ThemedText type="button"
  },
});
