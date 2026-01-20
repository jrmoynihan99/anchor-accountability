// app/onboarding/login.tsx
import { useTheme } from "@/context/ThemeContext";
import { useOrganizations } from "@/hooks/onboarding/useOrganizations";
import { getDeferredOrg } from "@/lib/getDeferredOrg";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { LoginForm } from "../../components/onboarding/login/LoginForm";
import { LoginHeader } from "../../components/onboarding/login/LoginHeader";

export default function LoginScreen() {
  // Get organization params from route
  const params = useLocalSearchParams<{
    organizationId?: string;
    organizationName?: string;
  }>();

  // Fetch all organizations from Firebase
  const { organizations } = useOrganizations();

  // Track the deferred org ID (persists even if user clears selection)
  const [deferredOrgId, setDeferredOrgId] = useState<string | null>(null);

  // Store the org ID from storage so we don't lose it after the first read
  const storedOrgId = useRef<string | null | undefined>(undefined);

  // State for selected organization (can be updated from modal)
  const [organizationId, setOrganizationId] = useState(
    params.organizationId || "public",
  );
  const [organizationName, setOrganizationName] = useState(
    params.organizationName || "Guest",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChurchModalVisible, setIsChurchModalVisible] = useState(false);

  const { colors } = useTheme();

  // Load deferred org on mount and when organizations load
  useEffect(() => {
    async function loadDeferredOrg() {
      // URL params take priority over deferred org
      if (params.organizationId) {
        return;
      }

      // Only read from storage once (before it gets cleared)
      if (storedOrgId.current === undefined) {
        storedOrgId.current = await getDeferredOrg();
      }

      // Wait for organizations to load from Firebase
      if (!storedOrgId.current || organizations.length === 0) {
        return;
      }

      // Only set state once
      if (deferredOrgId !== null) {
        return;
      }

      const org = organizations.find((o) => o.id === storedOrgId.current);

      if (org) {
        setDeferredOrgId(org.id);
        setOrganizationId(org.id);
        setOrganizationName(org.name);
      }
    }

    loadDeferredOrg();
  }, [params.organizationId, organizations, deferredOrgId]);

  // Handle church selection from modal
  const handleChurchSelected = (orgId: string, orgName: string) => {
    setOrganizationId(orgId);
    setOrganizationName(orgName);
  };

  // Smooth keyboard animation - only when modal is NOT visible
  const keyboard = useAnimatedKeyboard();
  const translateY = useDerivedValue(() => {
    // Don't animate if church modal is open
    if (isChurchModalVisible) {
      return 0;
    }
    return withSpring(-keyboard.height.value * 0.5, {
      damping: 20,
      stiffness: 100,
      mass: 0.5,
    });
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[styles.container, { backgroundColor: colors.cardBackground }]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <LinearGradient
          colors={[colors.cardBackground, colors.tint]}
          style={styles.gradient}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.content, animatedStyle]}>
            <LoginHeader
              isSignUp={isSignUp}
              onBackPress={() => router.back()}
            />

            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isSignUp={isSignUp}
              setIsSignUp={setIsSignUp}
              loading={loading}
              setLoading={setLoading}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              organizationId={organizationId}
              organizationName={organizationName}
              deferredOrgId={deferredOrgId}
              onChurchSelected={handleChurchSelected}
              onChurchModalVisibilityChange={setIsChurchModalVisible}
            />
          </Animated.View>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
