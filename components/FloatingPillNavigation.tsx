import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloatingPillNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  showPleasNotification?: boolean;
  showMessagesNotification?: boolean;
}

interface TabLayout {
  x: number;
  width: number;
}

const CENTER_GAP = 90;
const ICON_SIZE = 26;
const PILL_RADIUS = 30;
const CONTAINER_PADDING = 8;
const TAB_GAP = 8;

const LEFT_ICONS = [
  { key: "index", icon: "house.fill" },
  { key: "pleas", icon: "megaphone.fill" },
];
const RIGHT_ICONS = [
  { key: "messages", icon: "message.fill" },
  { key: "community", icon: "person.3.fill" },
];

// --- Notification Dot Component ---
function NotificationDot({
  color,
  borderColor,
}: {
  color: string;
  borderColor: string;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: -3,
        right: -3,
        width: 11,
        height: 11,
        borderRadius: 5.5,
        backgroundColor: color,
        borderWidth: 1.5,
        borderColor,
        zIndex: 2,
      }}
    />
  );
}

export function FloatingPillNavigation({
  activeTab,
  onTabPress,
  showPleasNotification,
  showMessagesNotification,
}: FloatingPillNavigationProps) {
  const insets = useSafeAreaInsets();
  const { colors, effectiveTheme } = useTheme();
  const ICONS = [...LEFT_ICONS, ...RIGHT_ICONS];
  const [tabLayouts, setTabLayouts] = useState<TabLayout[]>([]);
  const animatedX = useSharedValue(0);
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    const activeIndex = ICONS.findIndex((tab) => tab.key === activeTab);
    const activeLayout = tabLayouts[activeIndex];

    if (activeLayout) {
      animatedX.value = withSpring(activeLayout.x, {
        damping: 35,
        stiffness: 500,
      });
      animatedWidth.value = withSpring(activeLayout.width, {
        damping: 27,
        stiffness: 500,
      });
    }
  }, [activeTab, tabLayouts]);

  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prevLayouts) => {
      const newLayouts = [...prevLayouts];
      newLayouts[index] = { x, width };
      return newLayouts;
    });
  };

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: animatedX.value }],
      width: animatedWidth.value,
    };
  });

  return (
    <View style={[styles.container, { bottom: insets.bottom + 15 }]}>
      <View style={[styles.shadowParent, { shadowColor: colors.shadow }]}>
        <BlurView
          intensity={80}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
          style={styles.roundedChild}
        >
          <View
            style={[
              styles.pillContainer,
              {
                backgroundColor: colors.navBackground,
                borderColor: colors.navBorder,
              },
            ]}
          >
            {/* Animated background pill */}
            <Animated.View
              style={[
                styles.animatedPill,
                { backgroundColor: colors.tint },
                animatedPillStyle,
              ]}
            />

            {/* LEFT ICONS */}
            {LEFT_ICONS.map((tab, idx) => {
              const isActive = activeTab === tab.key;
              const isLast = idx === LEFT_ICONS.length - 1;
              // Notification on megaphone
              const showNotif = tab.key === "pleas" && showPleasNotification;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onTabPress(tab.key);
                  }}
                  onLayout={(event) => handleTabLayout(idx, event)}
                  style={[
                    styles.tabButton,
                    !isLast && { marginRight: TAB_GAP },
                  ]}
                >
                  <View style={{ position: "relative" }}>
                    <IconSymbol
                      size={ICON_SIZE}
                      name={tab.icon as any}
                      color={
                        isActive ? colors.navActiveText : colors.tabIconDefault
                      }
                    />
                    {showNotif ? (
                      <NotificationDot
                        color={colors.error}
                        borderColor={colors.navActiveText}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}

            {/* CENTER GAP FOR CTA */}
            <View style={{ width: CENTER_GAP }} />

            {/* RIGHT ICONS */}
            {RIGHT_ICONS.map((tab, idx) => {
              const isActive = activeTab === tab.key;
              const iconIndex = LEFT_ICONS.length + idx;
              const isLast = idx === RIGHT_ICONS.length - 1;
              // Notification on messages
              const showNotif =
                tab.key === "messages" && showMessagesNotification;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onTabPress(tab.key);
                  }}
                  onLayout={(event) => handleTabLayout(iconIndex, event)}
                  style={[
                    styles.tabButton,
                    !isLast && { marginRight: TAB_GAP },
                  ]}
                >
                  <View style={{ position: "relative" }}>
                    <IconSymbol
                      size={ICON_SIZE}
                      name={tab.icon as any}
                      color={
                        isActive ? colors.navActiveText : colors.tabIconDefault
                      }
                    />
                    {showNotif ? (
                      <NotificationDot
                        color={colors.error}
                        borderColor={colors.navActiveText}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  shadowParent: {
    borderRadius: PILL_RADIUS,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  roundedChild: {
    borderRadius: PILL_RADIUS,
    overflow: "hidden",
  },
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: CONTAINER_PADDING,
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
    // gap: TAB_GAP, // if supported by your RN version, you can use this instead of marginRight above
  },
  tabButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  animatedPill: {
    position: "absolute",
    top: 6,
    left: 0,
    height: 46,
    borderRadius: 23,
    zIndex: 0,
  },
});
