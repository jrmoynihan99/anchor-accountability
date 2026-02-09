import { useTheme } from "@/context/ThemeContext";
import { addDeepLinkedOrg } from "@/lib/deepLinkedOrgs";
import { auth } from "@/lib/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, NativeModules, Platform, View } from "react-native";

export default function JoinRedirect() {
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  useEffect(() => {
    async function handleJoin() {
      const org = params.org as string | undefined;

      if (!org) {
        // No org param, just redirect based on auth
        router.replace(auth.currentUser ? "/(tabs)" : "/onboarding/intro");
        return;
      }

      if (auth.currentUser) {
        // Already authenticated - don't navigate, just go back
        // The app is already in the right state (tabs)
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)");
        }
      } else {
        // Not authenticated, save org and go to login

        // Persist durably for PIN bypass and pre-selection (survives restarts)
        await addDeepLinkedOrg(org);

        // Also save to platform temp storage (for getDeferredOrg compatibility)
        if (Platform.OS === "ios") {
          const { AppGroupStorage } = NativeModules;
          if (AppGroupStorage?.setDeferredOrg) {
            try {
              await AppGroupStorage.setDeferredOrg(org);
            } catch (error) {
              console.error("Failed to save org:", error);
            }
          }
        } else if (Platform.OS === "android") {
          try {
            const AsyncStorage =
              require("@react-native-async-storage/async-storage").default;
            await AsyncStorage.setItem("@deferred_org", org);
          } catch (error) {
            console.error("Failed to save org:", error);
          }
        }

        // If we can't go back, we're coming from a killed state - need to build proper stack
        if (!router.canGoBack()) {
          // Navigate to intro first, then push login to create proper back stack
          router.replace("/onboarding/intro");
          setTimeout(() => {
            router.push("/onboarding/login");
          }, 100);
        } else {
          // App was already running, just navigate to login
          router.replace("/onboarding/login");
        }
      }
    }

    handleJoin();
  }, [params.org]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cardBackground }}>
      <LinearGradient
        colors={[colors.cardBackground, colors.tint]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={colors.cardBackground} />
      </LinearGradient>
    </View>
  );
}
