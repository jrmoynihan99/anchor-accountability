// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
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
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { getHasOnboarded } from "@/lib/onboarding";

// Font imports
import {
  Spectral_400Regular,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
  useFonts as useSpectralFonts,
} from "@expo-google-fonts/spectral";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();

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
        console.log("Checking onboarding status...");
        const hasCompleted = await getHasOnboarded();
        console.log("Has completed:", hasCompleted);

        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }

        // Only navigate if we're not already in the right place
        if (hasCompleted && inAuthGroup) {
          console.log("Redirecting to tabs...");
          router.replace("/(tabs)");
        } else if (!hasCompleted && !inAuthGroup) {
          console.log("Redirecting to onboarding...");
          router.replace("/onboarding/intro");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }
        router.replace("/onboarding/intro");
      }
    };

    checkAuth();
  }, [spectralLoaded, navigationState?.key, isNavigationReady]);

  if (!spectralLoaded || !isNavigationReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#fff" : "#667eea"}
        />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: false,
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
