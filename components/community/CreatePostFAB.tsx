// components/community/CreatePostFAB.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreatePostModal } from "./CreatePostModal";

export function CreatePostFAB() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate button
    rotation.value = withSpring(rotation.value + 45);
    scale.value = withTiming(0.9, { duration: 100 }, () => {
      scale.value = withSpring(1);
    });

    setShowModal(true);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.fab,
          animatedStyle,
          {
            backgroundColor: colors.buttonBackground,
            shadowColor: colors.shadow,
            bottom: insets.bottom + 100,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <IconSymbol name="plus" size={28} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <CreatePostModal
        isVisible={showModal}
        onClose={() => {
          setShowModal(false);
          rotation.value = withSpring(0);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  fabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
