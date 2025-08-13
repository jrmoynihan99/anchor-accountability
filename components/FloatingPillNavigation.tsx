import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
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
}

interface TabLayout {
  x: number;
  width: number;
}

export function FloatingPillNavigation({
  activeTab,
  onTabPress,
}: FloatingPillNavigationProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const tabs = [
    { key: "index", label: "Home", icon: "house.fill" },
    { key: "explore", label: "Messages", icon: "message.fill" },
    { key: "community", label: "Community", icon: "person.3.fill" },
  ];

  // Track tab layouts for dynamic sizing
  const [tabLayouts, setTabLayouts] = useState<TabLayout[]>([]);

  // Animation values
  const animatedX = useSharedValue(0);
  const animatedWidth = useSharedValue(0);

  // Update animation when active tab changes or layouts are measured
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
    const activeLayout = tabLayouts[activeIndex];

    if (activeLayout) {
      animatedX.value = withSpring(activeLayout.x, {
        damping: 27,
        stiffness: 350,
      });
      animatedWidth.value = withSpring(activeLayout.width, {
        damping: 27,
        stiffness: 350,
      });
    }
  }, [activeTab, tabLayouts]);

  // Handle tab layout measurement
  const handleTabLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;

    setTabLayouts((prevLayouts) => {
      const newLayouts = [...prevLayouts];
      newLayouts[index] = { x, width };
      return newLayouts;
    });
  };

  // Animated style for the sliding pill
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
          tint={colorScheme === "dark" ? "dark" : "light"}
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

            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onTabPress(tab.key);
                  }}
                  onLayout={(event) => handleTabLayout(index, event)}
                  style={[
                    styles.tabButton,
                    index === 0 && styles.firstTab,
                    index === tabs.length - 1 && styles.lastTab,
                  ]}
                >
                  <IconSymbol
                    size={20}
                    name={tab.icon as any}
                    color={
                      isActive ? colors.navActiveText : colors.tabIconDefault
                    }
                  />
                  <ThemedText
                    type="tab"
                    style={{
                      color: isActive
                        ? colors.navActiveText
                        : colors.tabIconDefault,
                    }}
                  >
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const PILL_RADIUS = 25;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  // Outermost: gets the shadow and radius, NO overflow
  shadowParent: {
    borderRadius: PILL_RADIUS,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
    // No overflow here!
  },
  // Inner: gets the border radius and overflow, no shadow
  roundedChild: {
    borderRadius: PILL_RADIUS,
    overflow: "hidden", // ensures pill shape and content is clipped
  },
  pillContainer: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: PILL_RADIUS,
    borderWidth: 1,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
    gap: 6,
    zIndex: 1, // Ensure buttons stay above the animated pill
  },
  animatedPill: {
    position: "absolute",
    top: 8,
    left: 0,
    height: 36,
    borderRadius: 20,
    zIndex: 0,
  },
  firstTab: {
    marginRight: 4,
  },
  lastTab: {
    marginLeft: 4,
  },
  // Removed tabLabel style - now using Typography.styles.tab
});
