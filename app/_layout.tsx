// app/_layout.tsx
import { RejectionModal } from "@/components/RejectionModal";
import { ThreadProvider, useThread } from "@/hooks/ThreadContext"; // Add this
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { useRejectionModalController } from "@/hooks/useRejectionModal";
import { ensureSignedIn } from "@/lib/auth";
import { getHasOnboarded } from "@/lib/onboarding";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

// Font imports
import {
  Spectral_400Regular,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
  useFonts as useSpectralFonts,
} from "@expo-google-fonts/spectral";
import * as Notifications from "expo-notifications";

// 👇 Import your ThemeProvider and useTheme
import { ThemeProvider, useTheme } from "@/hooks/ThemeContext";

// 👇 Set foreground notification handler with dynamic behavior
let getCurrentThreadId: (() => string | null) | null = null;
let getCurrentPleaId: (() => string | null) | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // If this is a message notification (has threadId) and user is in that thread, don't show banner
    if (data?.threadId && getCurrentThreadId) {
      const currentThread = getCurrentThreadId();

      if (currentThread === data.threadId) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }

    // If this is an encouragement notification and user is viewing that plea, don't show banner
    if (data?.pleaId && data?.type === "encouragement" && getCurrentPleaId) {
      const currentPlea = getCurrentPleaId();

      if (currentPlea === data.pleaId) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }

    // Default behavior for all other notifications
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

SplashScreen.preventAutoHideAsync();

// 👇 A wrapper so we can use useTheme and useThread inside
function ThemedStack() {
  const { effectiveTheme } = useTheme();
  const { currentThreadId, currentPleaId } = useThread();

  // Set up the function reference for the notification handler
  useEffect(() => {
    getCurrentThreadId = () => currentThreadId;
    getCurrentPleaId = () => currentPleaId;

    // Cleanup on unmount
    return () => {
      getCurrentThreadId = null;
      getCurrentPleaId = null;
    };
  }, [currentThreadId, currentPleaId]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="message-thread"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="plea-view-all"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="my-reachouts-all"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* 👇 Dynamically set StatusBar style based on palette/mode */}
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
    </>
  );
}

function AppContent() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { currentThreadId, currentPleaId } = useThread(); // Get both current thread and plea from context

  // 👇 Set up the rejection modal controller (Reanimated + state)
  const rejectionModal = useRejectionModalController();

  // 👇 Pass current thread and plea info to notification handler
  useNotificationHandler({
    openRejectionModal: rejectionModal.open,
    currentThreadId: currentThreadId,
    currentPleaId: currentPleaId,
  });

  const [spectralLoaded] = useSpectralFonts({
    Spectral_400Regular,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
  });

  // Check if we're in the auth group
  const inAuthGroup = segments[0] === "onboarding";

  useEffect(() => {
    if (!spectralLoaded || !navigationState?.key) return;

    const checkAuth = async () => {
      try {
        const hasCompleted = await getHasOnboarded();

        // If onboarding is complete, ensure Firebase auth
        if (hasCompleted) {
          await ensureSignedIn();
        }

        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }

        // Only navigate if we're not already in the right place
        if (hasCompleted && inAuthGroup) {
          router.replace("/(tabs)");
        } else if (!hasCompleted && !inAuthGroup) {
          router.replace("/onboarding/intro");
        }
      } catch (error) {
        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }
        router.replace("/onboarding/intro");
      }
    };

    checkAuth();
    // eslint-disable-next-line
  }, [spectralLoaded, navigationState?.key, isNavigationReady]);

  if (!spectralLoaded || !isNavigationReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff", // Or some fallback color
          }}
        >
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <>
      <ThemedStack />
      <RejectionModal
        isVisible={rejectionModal.visible}
        close={rejectionModal.close}
        type={rejectionModal.type}
        message={rejectionModal.message}
        reason={rejectionModal.reason}
      />
    </>
  );
}

export default function RootLayout() {
  // 👇 Wrap app in providers
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThreadProvider>
          <AppContent />
        </ThreadProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
