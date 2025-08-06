// app/(tabs)/_layout.tsx
import { FloatingPillNavigation } from "@/components/FloatingPillNavigation";
import { FloatingReachOutButton } from "@/components/FloatingReachOutButton";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Tabs, useRouter, useSegments } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  // Get the current active tab
  const lastSegment = segments[segments.length - 1];
  const activeTab =
    lastSegment === "(tabs)" || lastSegment === undefined
      ? "index"
      : lastSegment;

  const handleTabPress = (tab: string) => {
    if (tab === "index") {
      router.push("/(tabs)");
    } else if (tab === "explore") {
      router.push("/(tabs)/explore");
    } else if (tab === "community") {
      router.push("/(tabs)/community");
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          // Hide the default tab bar
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Messages",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="message.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: "Community",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.3.fill" color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Only render FloatingReachOutButton if NOT on index tab */}
      {activeTab !== "index" && <FloatingReachOutButton />}

      {/* Custom floating pill navigation */}
      <FloatingPillNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </GestureHandlerRootView>
  );
}
