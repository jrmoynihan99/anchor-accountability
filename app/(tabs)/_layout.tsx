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
import { useModalIntent } from "@/context/ModalIntentContext";
import { useTheme } from "@/hooks/ThemeContext";
import { useMyReachOuts } from "@/hooks/useMyReachOuts";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useThreads } from "@/hooks/useThreads";
import { Tabs, useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View } from "react-native";

export default function TabLayout() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { myReachOuts } = useMyReachOuts();
  const hasUnreadEncouragements = myReachOuts.some((r) => r.unreadCount > 0);
  const { threads } = useThreads();
  const hasUnreadMessages = threads.some((thread) => thread.unreadCount > 0);

  // Notification permission management
  const { shouldShowModal, handlePermissionResult, closeModal } =
    useNotificationPermission();

  // Settings modal state management
  const settingsModalOpenRef = useRef<(() => void) | null>(null);
  const [settingsInitialScreen, setSettingsInitialScreen] = useState<
    "settings" | "guidelines"
  >("settings");

  // Modal Intent context handling
  const { modalIntent, setModalIntent } = useModalIntent();

  useEffect(() => {
    if (modalIntent === "settingsGuidelines") {
      setSettingsInitialScreen("guidelines");
      setTimeout(() => {
        if (settingsModalOpenRef.current) settingsModalOpenRef.current();
        setModalIntent(null); // clear after use
      }, 300);
    }
  }, [modalIntent, setModalIntent]);

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
      {/* Sticky Top Blur Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 30,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        <MaskedView
          style={{ flex: 1 }}
          maskElement={
            <LinearGradient
              colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
              locations={[0.5, 1]}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          }
        >
          <BlurView
            intensity={50}
            tint={effectiveTheme === "dark" ? "dark" : "light"}
            style={{ flex: 1 }}
          >
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: colors.background,
                opacity: Platform.OS === "ios" ? 0.4 : 0.95,
              }}
            />
          </BlurView>
        </MaskedView>
      </View>

      {/* Main Tabs */}
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
        buttonBorderRadius={35}
        modalWidthPercent={0.9}
        modalHeightPercent={0.75}
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
              buttonVariant="circle"
              buttonSize={70}
              iconSize={38}
              borderWidth={1}
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
        }) => {
          // Store the open function for programmatic access
          settingsModalOpenRef.current = open;

          // One-time measurement for settings button to enable proper morph animation
          React.useEffect(() => {
            // Trigger the same measurement that handlePressIn does
            const timer = setTimeout(() => {
              handlePressIn();
              setTimeout(() => {
                handlePressOut();
              }, 10);
            }, 100);
            return () => clearTimeout(timer);
          }, []);

          // Reset initial screen when modal closes
          React.useEffect(() => {
            if (!isModalVisible) {
              setSettingsInitialScreen("settings");
            }
          }, [isModalVisible]);

          return (
            <>
              <FloatingSettingsButton
                ref={buttonRef}
                style={buttonAnimatedStyle}
                onPress={() => {
                  setSettingsInitialScreen("settings"); // Reset to settings when manually opened
                  open();
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              />
              <FloatingSettingsModal
                isVisible={isModalVisible}
                progress={progress}
                modalAnimatedStyle={modalAnimatedStyle}
                close={close}
                initialScreen={settingsInitialScreen}
              />
            </>
          );
        }}
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
