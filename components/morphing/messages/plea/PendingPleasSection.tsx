// components/messages/PendingPleasSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { usePendingPleas } from "@/hooks/usePendingPleas";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ButtonModalTransitionBridge } from "../../ButtonModalTransitionBridge";
import { PleaCard, PleaData } from "./PleaCard";
import { PleaResponseModal } from "./PleaResponseModal";

const PREVIEW_LIMIT = 3; // Only show 3 pleas on main messages screen

export function PendingPleasSection() {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const { pendingPleas, loading, error } = usePendingPleas();

  // State for selected plea for modal
  const [selectedPlea, setSelectedPlea] = useState<PleaData | null>(null);

  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to pending pleas screen
    console.log("Navigate to full pending pleas screen");
    // router.push("/pending-pleas");
  };

  if (loading) {
    return (
      <View style={styles.sectionCard}>
        <SectionHeader colors={colors} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <ThemedText
            type="caption"
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Loading recent requests...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.sectionCard}>
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
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.cardBackground,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <SectionHeader colors={colors} totalCount={pendingPleas.length} />

      {pendingPleas.length === 0 ? (
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
        <>
          <View style={styles.pleasContainer}>
            {displayedPleas.map((plea, index) => (
              <ButtonModalTransitionBridge
                key={plea.id}
                buttonBorderRadius={16} // PleaCard uses 16px border radius
                modalBorderRadius={28} // Modal uses 28px border radius
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
                      index={index}
                      buttonRef={buttonRef}
                      style={buttonAnimatedStyle}
                      onPress={() => {
                        setSelectedPlea(plea);
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
                    />
                  </>
                )}
              </ButtonModalTransitionBridge>
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
                View All ({pendingPleas.length})
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
          <IconSymbol name="hands.and.sparkles" size={20} color={colors.icon} />
        </View>
        <View style={styles.headerText}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Recent Requests
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {totalCount !== undefined
              ? `${totalCount} ${
                  totalCount === 1 ? "person needs" : "people need"
                } encouragement`
              : "People who need encouragement"}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  },
  viewAllText: {
    // Typography.styles.button handled by ThemedText type="button"
  },
});
