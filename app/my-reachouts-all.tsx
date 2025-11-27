// app/my-reachouts-all.tsx
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import {
  MyReachOutCard,
  MyReachOutData,
} from "@/components/morphing/pleas/my-reach-outs/MyReachOutCard";
import { MyReachOutModal } from "@/components/morphing/pleas/my-reach-outs/MyReachOutModal";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useMyReachOuts } from "@/hooks/useMyReachOuts";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 20; // Load 20 reach outs at a time

export default function MyReachOutsAllScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { myReachOuts, loading, error, loadMore, hasMore } = useMyReachOuts({
    pageSize: PAGE_SIZE,
    enablePagination: true,
  });

  // Get the pleaId from navigation params for notification deep linking
  const { openPleaId, originless } = useLocalSearchParams<{
    openPleaId?: string;
    originless?: string;
  }>();

  const useOriginless = originless === "1" || originless === "true";

  // Timer for live updates
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Modal state
  const [selectedReachOut, setSelectedReachOut] =
    useState<MyReachOutData | null>(null);

  // Store refs to modal controls for each reach out
  const modalRefs = useRef<{
    [key: string]: { open: () => void; openOriginless?: () => void };
  }>({});

  // Track if we've already processed this notification
  const processedNotificationRef = useRef<string | null>(null);

  // Auto-open modal if openPleaId is provided (from notification)
  useEffect(() => {
    if (
      openPleaId &&
      myReachOuts.length > 0 &&
      !loading &&
      processedNotificationRef.current !== openPleaId
    ) {
      const targetReachOut = myReachOuts.find((r) => r.id === openPleaId);
      if (targetReachOut) {
        processedNotificationRef.current = openPleaId; // Mark as processed

        // Small delay to ensure the screen is fully rendered and refs are set
        setTimeout(() => {
          setSelectedReachOut(targetReachOut);
          const controls = modalRefs.current[openPleaId];

          if (!controls) return;

          if (useOriginless && controls.openOriginless) {
            controls.openOriginless(); // 👈 notification → slide-up fallback
          } else {
            controls.open(); // normal path
          }
        }, 500);
      }
    }
  }, [openPleaId, useOriginless, myReachOuts, loading]);

  const handleBack = () => {
    router.back();
  };

  // Track if we're loading more
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle scroll to bottom
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasMore || isLoadingMore || loading) return;

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Trigger when within 100px of bottom

    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && loadMore) {
      setIsLoadingMore(true);
      loadMore();
      // Reset loading more state after a brief delay
      setTimeout(() => setIsLoadingMore(false), 500);
    }
  };

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

        {/* Header with blur effect */}
        <View style={styles.headerContainer}>
          <BlurView
            intensity={Platform.OS === "android" ? 100 : 80}
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
                  <IconSymbol name="paperplane" size={20} color={colors.icon} />
                </View>
                <View style={styles.headerText}>
                  <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                    My Reach Outs
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {myReachOuts.length}{" "}
                    {myReachOuts.length === 1 ? "request" : "requests"} for
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
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          {loading && myReachOuts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textSecondary} />
              <ThemedText
                type="caption"
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading your reach outs...
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
                Unable to load your reach outs
              </ThemedText>
              <ThemedText
                type="caption"
                style={[styles.emptySubtext, { color: colors.textSecondary }]}
              >
                Please try again later
              </ThemedText>
            </View>
          ) : myReachOuts.length === 0 ? (
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
                When you need support, reach out using the button on the Home
                tab
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.reachOutsContainer}>
                {myReachOuts.map((reachOut, index) => (
                  <Animated.View
                    key={reachOut.id}
                    entering={FadeInDown}
                    layout={LinearTransition.duration(300)}
                    style={{ width: "100%" }}
                  >
                    <ButtonModalTransitionBridge
                      buttonBorderRadius={16}
                      modalBorderRadius={28}
                    >
                      {({
                        open,
                        openOriginless,
                        close,
                        isModalVisible,
                        progress,
                        buttonAnimatedStyle,
                        modalAnimatedStyle,
                        buttonRef,
                        handlePressIn,
                        handlePressOut,
                      }) => {
                        // Store the open functions for notification deep linking
                        modalRefs.current[reachOut.id] = {
                          open,
                          openOriginless,
                        };

                        return (
                          <>
                            <MyReachOutCard
                              reachOut={reachOut}
                              index={index}
                              buttonRef={buttonRef}
                              style={buttonAnimatedStyle}
                              now={now}
                              onPress={() => {
                                setSelectedReachOut(reachOut);
                                open(); // user taps → keep morph animation
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
                        );
                      }}
                    </ButtonModalTransitionBridge>
                  </Animated.View>
                ))}
              </View>

              {/* Loading more indicator */}
              {(isLoadingMore || (hasMore && !loading)) && (
                <View style={styles.loadingMoreContainer}>
                  {isLoadingMore ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color={colors.textSecondary}
                      />
                      <ThemedText
                        type="caption"
                        style={[
                          styles.loadingMoreText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Loading more...
                      </ThemedText>
                    </>
                  ) : (
                    <ThemedText
                      type="caption"
                      style={[
                        styles.loadingMoreText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Scroll to load more
                    </ThemedText>
                  )}
                </View>
              )}

              {/* End of list indicator */}
              {!hasMore && myReachOuts.length > 0 && (
                <View style={styles.endOfListContainer}>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.endOfListText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    You've reached the end
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
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
  reachOutsContainer: {
    gap: 16,
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 12,
  },
  loadingMoreText: {
    opacity: 0.7,
  },
  endOfListContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  endOfListText: {
    opacity: 0.6,
  },
});
