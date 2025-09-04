// app/(tabs)/_layout.tsx
import { FloatingPillNavigation } from "@/components/FloatingPillNavigation";
import { HapticTab } from "@/components/HapticTab";
import { NotificationPermissionModal } from "@/components/NotificationPermissionModal";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { FloatingMainCTAButton } from "@/components/morphing/home/reach-out-main-button/FloatingMainCTAButton";
import { ReachOutModal } from "@/components/morphing/home/reach-out-main-button/ReachOutModal";
import { FloatingSettingsButton } from "@/components/morphing/settings/FloatingSettingsButton";
import { FloatingSettingsModal } from "@/components/morphing/settings/FloatingSettingsModal";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useTheme } from "@/hooks/ThemeContext";
import { useMyReachOuts } from "@/hooks/useMyReachOuts";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useThreads } from "@/hooks/useThreads";
import { Tabs, useRouter, useSegments } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { myReachOuts } = useMyReachOuts();
  const hasUnreadEncouragements = myReachOuts.some((r) => r.unreadCount > 0);
  const { threads } = useThreads();
  const hasUnreadMessages = threads.some((thread) => thread.unreadCount > 0);

  // Notification permission management
  const { shouldShowModal, handlePermissionResult, closeModal } =
    useNotificationPermission();

  // Get the current active tab
  const lastSegment = segments[segments.length - 1];
  const activeTab =
    lastSegment === "(tabs)" || lastSegment === undefined
      ? "index"
      : lastSegment;

  const handleTabPress = (tab: string) => {
    if (tab === "index") {
      router.push("/(tabs)");
    } else if (tab === "pleas") {
      router.push("/(tabs)/pleas");
    } else if (tab === "messages") {
      router.push("/(tabs)/messages");
    } else if (tab === "community") {
      router.push("/(tabs)/community");
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
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
          name="pleas"
          options={{
            title: "Pleas",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="megaphone.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
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

      {/* Floating nav bar */}
      <FloatingPillNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
        showPleasNotification={hasUnreadEncouragements}
        showMessagesNotification={hasUnreadMessages}
      />

      {/* Floating main CTA (with morph/transition modal) */}
      <ButtonModalTransitionBridge
        buttonBorderRadius={35} // perfectly matches the circle
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
            <FloatingMainCTAButton
              ref={buttonRef}
              style={buttonAnimatedStyle}
              onPress={open}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
            <ReachOutModal
              isVisible={isModalVisible}
              progress={progress}
              modalAnimatedStyle={modalAnimatedStyle}
              close={close}
              ctaButtonContent={
                <FloatingMainCTAButton
                  // For morphing back (should match appearance/size)
                  onPress={() => {}}
                  size={70}
                  iconSize={38}
                  borderWidth={1}
                />
              }
            />
          </>
        )}
      </ButtonModalTransitionBridge>

      {/* Floating settings (with morph/transition modal) */}
      <ButtonModalTransitionBridge
        buttonBorderRadius={20} // matches the settings button border radius
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
            <FloatingSettingsButton
              ref={buttonRef}
              style={buttonAnimatedStyle}
              onPress={open}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            />
            <FloatingSettingsModal
              isVisible={isModalVisible}
              progress={progress}
              modalAnimatedStyle={modalAnimatedStyle}
              close={close}
            />
          </>
        )}
      </ButtonModalTransitionBridge>

      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        isVisible={shouldShowModal}
        onClose={closeModal}
        onPermissionResult={handlePermissionResult}
      />
    </GestureHandlerRootView>
  );
}
