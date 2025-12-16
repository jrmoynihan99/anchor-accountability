// components/morphing/settings/FloatingSettingsModal.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { useLegalContent } from "@/hooks/useLegalContent";
import { isAnonymousUser } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { AboutSection } from "./AboutSection";
import { AppearanceSection } from "./AppearanceSection";
import { BlockListSection } from "./BlockListSection";
import { BlockListView } from "./BlockListView";
import { ConvertAccountButton } from "./ConvertAccountButton";
import { ConvertAccountView } from "./ConvertAccountView";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { NotificationsSection } from "./NotificationsSection";
import { PrivacySection } from "./PrivacySection";
import { SettingsHeader } from "./SettingsHeader";
import { SignOutButton } from "./SignOutButton";
import { TextContentView } from "./TextContentView";

interface FloatingSettingsModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  initialScreen?: "settings" | "guidelines";
}

type ScreenType = "settings" | "textContent" | "blockList" | "convertAccount";

interface TextContentData {
  title: string;
  content: string;
}

export function FloatingSettingsModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  initialScreen = "settings",
}: FloatingSettingsModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const { termsOfService, privacyPolicy, loading } = useLegalContent();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("settings");
  const [textContentData, setTextContentData] =
    useState<TextContentData | null>(null);
  const screenTransition = useSharedValue(0);
  const [shouldLoadNotifications, setShouldLoadNotifications] = useState(false);

  // Check if user is anonymous
  const isAnonymous = isAnonymousUser();

  // Delay loading notifications until modal is fully open
  useEffect(() => {
    let timer: number | null = null;
    if (isVisible && currentScreen === "settings") {
      timer = setTimeout(() => {
        setShouldLoadNotifications(true);
      }, 350);
    } else {
      setShouldLoadNotifications(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, currentScreen]);

  // Initialize modal state based on initialScreen prop
  useEffect(() => {
    if (isVisible && initialScreen === "guidelines") {
      const content = getTextContent("community");
      setTextContentData({ title: "Guidelines", content: content.content });
      setCurrentScreen("textContent");
      screenTransition.value = 1;
    } else if (isVisible && initialScreen === "settings") {
      setCurrentScreen("settings");
      screenTransition.value = 0;
    }
  }, [isVisible, initialScreen]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setCurrentScreen("settings");
        setTextContentData(null);
        screenTransition.value = 0;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const transitionToTextContent = (title: string, contentType: string) => {
    const content = getTextContent(
      contentType as "privacy" | "terms" | "about" | "community"
    );
    setTextContentData({ title, content: content.content });
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setCurrentScreen("textContent");
  };

  const transitionToBlockList = () => {
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setCurrentScreen("blockList");
  };

  const transitionToConvertAccount = () => {
    screenTransition.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    setCurrentScreen("convertAccount");
  };

  const handleBackToSettings = () => {
    screenTransition.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    // Delay state change until after animation completes
    setTimeout(() => {
      setCurrentScreen("settings");
      setTextContentData(null);
    }, 300);
  };

  // Text content for different sections
  const getTextContent = (
    type: "privacy" | "terms" | "about" | "community"
  ) => {
    switch (type) {
      case "privacy":
        return {
          title: "Privacy Policy",
          content: privacyPolicy,
        };
      case "terms":
        return {
          title: "Terms of Service",
          content: termsOfService,
        };
      case "about":
        return {
          title: "Why We Made This",
          content: `This app was born from personal struggle, shame, and the desperate need for a different way to seek help.

My Story
I struggled with pornography for years, and lust is still something I battle every day. Like many others, I tried accountability partners, and they worked great when I actually used them. But too often, I found excuses not to "bother" them.

Really, it wasn't about bothering them. It was about shame. It was about not wanting to disappoint someone again.

Traditional accountability requires vulnerability with specific people who know you. While this IS incredibly powerful, it also creates barriers:
- Fear of disappointing someone you care about
- Shame of repeated failure
- The temptation to isolate when you need help most
- The vulnerability required to reach out in moments of weakness

The Solution
What if reaching out for help had no shame attached? What if you could get immediate support without anyone knowing it was you? What if there was always someone ready to encourage you, no matter what time it was?

That's this app. One click to reach out. Anonymous encouragement from others who understand. The option to chat privately with those offering support, still completely anonymous.

Not a Replacement
This isn't meant to replace real accountability partners, therapy, or professional help. It's meant to lower the barrier to seeking support when shame and isolation try to take over.

I believe everyone can be free from shame and the struggles that keep us isolated. I believe community and encouragement can be powerful tools for avoiding temptation. I believe you're worth fighting for, even on the days you don't believe it yourself.

Let's beat this together.`,
        };
      case "community":
        return {
          title: "Guidelines",
          content: `Our community thrives on encouragement, and respect.

- Treat every user with dignity.
- Avoid spam, trolling, or negative remarks.
- Report anything that seems unsafe or abusive.

Things we do not allow:
1. Spam/Trolling
2. Hateful/Abusive content

Thank you for helping us keep this a safe and welcoming space!`,
        };
    }
  };

  // Animation styles
  const settingsScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          screenTransition.value,
          [0, 1],
          [0, -100],
          "clamp"
        ),
      },
    ],
    opacity: interpolate(
      screenTransition.value,
      [0, 0.8, 1],
      [1, 0.3, 0],
      "clamp"
    ),
  }));

  const textContentScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          screenTransition.value,
          [0, 1],
          [300, 0],
          "clamp"
        ),
      },
    ],
    opacity: interpolate(
      screenTransition.value,
      [0, 0.2, 1],
      [0, 1, 1],
      "clamp"
    ),
  }));

  // Button content (the settings icon in its collapsed state)
  const buttonContent = (
    <BlurView
      intensity={80}
      tint={effectiveTheme === "dark" ? "dark" : "light"}
      style={styles.buttonBlur}
    >
      <View
        style={[
          styles.backgroundContainer,
          {
            backgroundColor: colors.navBackground,
            borderColor: colors.navBorder,
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons
          name="settings-sharp"
          size={24}
          color={colors.tabIconSelected}
        />
      </View>
    </BlurView>
  );

  // Modal content with screen transitions
  const modalContent = (
    <View style={styles.screenContainer}>
      {/* Settings Screen - Always rendered */}
      <Animated.View style={[styles.screenWrapper, settingsScreenStyle]}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SettingsHeader />
          <View style={styles.settingsSection}>
            <NotificationsSection shouldLoad={shouldLoadNotifications} />
            <BlockListSection onNavigateToBlockList={transitionToBlockList} />
            <AppearanceSection />
            <AboutSection onNavigateToContent={transitionToTextContent} />
            <PrivacySection onNavigateToContent={transitionToTextContent} />

            {/* Only show Sign Out for email users */}
            {!isAnonymous && <SignOutButton />}

            {/* Show Convert Account for anonymous users */}
            {isAnonymous && (
              <ConvertAccountButton
                onNavigateToConvertAccount={transitionToConvertAccount}
              />
            )}

            {/* Always show Delete Account */}
            <DeleteAccountButton />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Text Content Screen - Conditionally rendered */}
      {currentScreen === "textContent" && textContentData && (
        <Animated.View style={[styles.screenWrapper, textContentScreenStyle]}>
          <TextContentView
            title={textContentData.title}
            content={textContentData.content}
            onBackPress={handleBackToSettings}
            colors={colors}
          />
        </Animated.View>
      )}
      {currentScreen === "blockList" && (
        <Animated.View style={[styles.screenWrapper, textContentScreenStyle]}>
          <BlockListView onBackPress={handleBackToSettings} colors={colors} />
        </Animated.View>
      )}
      {currentScreen === "convertAccount" && (
        <Animated.View style={[styles.screenWrapper, textContentScreenStyle]}>
          <ConvertAccountView
            onBackPress={handleBackToSettings}
            colors={colors}
          />
        </Animated.View>
      )}
    </View>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor="transparent"
      buttonContentPadding={0}
      buttonBorderRadius={20}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  buttonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  backgroundContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  screenContainer: {
    flex: 1,
    position: "relative",
  },
  screenWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  settingsSection: {
    gap: 20,
  },
});
