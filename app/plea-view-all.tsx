// app/plea-view-all.tsx
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { PleaCard } from "@/components/morphing/messages/plea/PleaCard";
import { PleaResponseModal } from "@/components/morphing/messages/plea/PleaResponseModal";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { usePendingPleas } from "@/hooks/usePendingPleas";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_PLEAS = 20; // Show latest 20 pleas

export default function PleaViewAllScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { pendingPleas, loading, error } = usePendingPleas();

  // Get the pleaId from navigation params for notification deep linking
  const { openPleaId } = useLocalSearchParams<{ openPleaId?: string }>();

  // Timer for live updates
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Modal state
  const [selectedPleaId, setSelectedPleaId] = useState<string | null>(null);
  const selectedPlea =
    pendingPleas.find((p) => p.id === selectedPleaId) || null;

  // Store refs to modal controls for each plea
  const modalRefs = useRef<{ [key: string]: { open: () => void } }>({});

  // In /app/plea-view-all.tsx

  const [handledPleaId, setHandledPleaId] = useState<string | null>(null);

  // Prevent double opening
  useEffect(() => {
    if (
      openPleaId &&
      pendingPleas.length > 0 &&
      !loading &&
      openPleaId !== handledPleaId // <-- Only run if new/unhandled
    ) {
      const targetPlea = pendingPleas.find((p) => p.id === openPleaId);
      if (targetPlea) {
        setTimeout(() => {
          setSelectedPleaId(openPleaId);
          if (modalRefs.current[openPleaId]) {
            modalRefs.current[openPleaId].open();
          }
          setHandledPleaId(openPleaId); // Mark as handled!
        }, 500);
      }
    }
  }, [openPleaId, pendingPleas, loading, handledPleaId]);

  const handleBack = () => {
    router.back();
  };

  // Sort pleas the same way as the preview section
  const sortedPleas = [...pendingPleas].sort((a, b) => {
    const aIsUrgent =
      a.encouragementCount === 0 && getHoursAgo(a.createdAt, now) > 2;
    const bIsUrgent =
      b.encouragementCount === 0 && getHoursAgo(b.createdAt, now) > 2;
    if (aIsUrgent !== bIsUrgent) return Number(bIsUrgent) - Number(aIsUrgent);
    if (a.encouragementCount !== b.encouragementCount)
      return a.encouragementCount - b.encouragementCount;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const displayedPleas = sortedPleas.slice(0, MAX_PLEAS);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

        {/* Header with blur effect */}
        <View style={styles.headerContainer}>
          <BlurView
            intensity={80}
            tint={effectiveTheme === "dark" ? "dark" : "light"}
            style={styles.blurContainer}
          >
            {/* Status bar spacer */}
            <View
              style={[
                { height: insets.top },
                { backgroundColor: colors.navBackground },
              ]}
            />

            {/* Header content */}
            <View
              style={[
                styles.header,
                {
                  backgroundColor: colors.navBackground,
                  borderBottomColor: colors.navBorder,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <IconSymbol name="chevron.left" size={24} color={colors.tint} />
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.iconCircleBackground },
                  ]}
                >
                  <IconSymbol
                    name="hand.raised"
                    size={20}
                    color={colors.icon}
                  />
                </View>
                <View style={styles.headerText}>
                  <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                    Recent Requests
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {pendingPleas.length}{" "}
                    {pendingPleas.length === 1 ? "person needs" : "people need"}{" "}
                    support
                  </ThemedText>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 80, // Account for header height
              paddingBottom: insets.bottom + 40,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textSecondary} />
              <ThemedText
                type="caption"
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading recent requests...
              </ThemedText>
            </View>
          ) : error ? (
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
                Unable to load requests
              </ThemedText>
              <ThemedText
                type="caption"
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                Please try again later
              </ThemedText>
            </View>
          ) : pendingPleas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol
                name="heart.circle"
                size={32}
                color={colors.textSecondary}
                style={styles.emptyIcon}
              />
              <ThemedText
                type="captionMedium"
                style={[styles.emptyText, { color: colors.textSecondary }]}
              >
                No recent requests right now
              </ThemedText>
              <ThemedText
                type="caption"
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                When someone reaches out for help, you'll see their request here
              </ThemedText>
            </View>
          ) : (
            <View style={styles.pleasContainer}>
              {displayedPleas.map((plea, index) => (
                <Animated.View
                  key={plea.id}
                  layout={LinearTransition.duration(300)}
                  style={{ width: "100%" }}
                >
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
                    }) => {
                      // Store the open function for this plea for notification deep linking
                      modalRefs.current[plea.id] = { open };

                      return (
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
                      );
                    }}
                  </ButtonModalTransitionBridge>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

// Helper function for urgency calculation
function getHoursAgo(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 16,
  },
  loadingText: {
    opacity: 0.8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
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
    gap: 16,
  },
});
