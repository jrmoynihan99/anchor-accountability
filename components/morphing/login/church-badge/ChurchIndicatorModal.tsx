// components/onboarding/login/church-indicator/ChurchIndicatorModal.tsx
import { useTheme } from "@/context/ThemeContext";
import {
  OrganizationData,
  useOrganizations,
} from "@/hooks/onboarding/useOrganizations";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { BaseModal } from "../../../morphing/BaseModal";
import { ChurchIndicatorButton } from "./ChurchIndicatorButton";
import { ChurchListView } from "./ChurchListView";
import { CorrectCodeView } from "./CorrectCodeView";
import { PinEntryModalView } from "./PinEntryModalView";

interface ChurchIndicatorModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  organizationId: string;
  organizationName: string;
  onChurchSelected: (organizationId: string, organizationName: string) => void;
}

type ViewType = "list" | "pin" | "success";

export function ChurchIndicatorModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  organizationId,
  organizationName,
  onChurchSelected,
}: ChurchIndicatorModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const { organizations, loading, error } = useOrganizations();

  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [previousView, setPreviousView] = useState<ViewType | null>(null);
  const [transitionCount, setTransitionCount] = useState(0);
  const [selectedChurch, setSelectedChurch] = useState<OrganizationData | null>(
    null
  );

  const justOpened = useRef(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      justOpened.current = true;
      setCurrentView("list");
      setTransitionCount(0);
      setPreviousView(null);
      setSelectedChurch(null);

      setTimeout(() => {
        justOpened.current = false;
      }, 0);
    }
  }, [isVisible]);

  const transitionToView = (view: ViewType) => {
    setPreviousView(currentView);
    setCurrentView(view);
    setTransitionCount((prev) => prev + 1);
  };

  // Get slide animations based on direction
  const getViewTransition = (
    fromView: ViewType | null,
    toView: ViewType
  ): {
    entering: any;
    exiting: any;
  } => {
    // Back transition: pin → list
    const isBackTransition = fromView === "pin" && toView === "list";

    if (isBackTransition) {
      return {
        entering: SlideInLeft.springify().damping(70).stiffness(400),
        exiting: SlideOutLeft.springify().damping(70).stiffness(400),
      };
    }
    return {
      entering: SlideInRight.springify().damping(70).stiffness(400),
      exiting: SlideOutRight.springify().damping(70).stiffness(400),
    };
  };

  // Handlers
  const handleChurchSelect = (org: OrganizationData) => {
    setSelectedChurch(org);
    transitionToView("pin");
  };

  const handleBackFromPin = () => {
    transitionToView("list");
  };

  const handlePinSuccess = (orgId: string, orgName: string) => {
    // Show success screen
    transitionToView("success");

    // Update parent state
    onChurchSelected(orgId, orgName);

    // Auto-close after 3 seconds
    setTimeout(() => {
      close();
    }, 10000);
  };

  const handleClearSelection = () => {
    // Set to public/guest
    onChurchSelected("public", "Guest");
    // Close modal
    //close();
  };

  // Render view with animations
  const renderView = (view: ViewType) => {
    const { entering, exiting } = (() => {
      if (transitionCount === 0) {
        return {
          entering: undefined,
          exiting: SlideOutLeft.springify().damping(70).stiffness(400),
        };
      }

      return getViewTransition(previousView, view);
    })();

    const ViewContent = () => {
      switch (view) {
        case "list":
          return (
            <ChurchListView
              organizations={organizations}
              loading={loading}
              error={error}
              onChurchSelect={handleChurchSelect}
              onClearSelection={handleClearSelection}
              onClose={close}
              currentlySelectedId={organizationId}
            />
          );
        case "pin":
          if (!selectedChurch) return null;
          return (
            <PinEntryModalView
              church={selectedChurch}
              onBack={handleBackFromPin}
              onSuccess={handlePinSuccess}
            />
          );
        case "success":
          if (!selectedChurch) return null;
          return <CorrectCodeView churchName={selectedChurch.name} />;
        default:
          return null;
      }
    };

    return (
      <Animated.View
        key={view}
        entering={entering}
        exiting={isVisible ? exiting : undefined}
        style={StyleSheet.absoluteFill}
        pointerEvents={isVisible ? "auto" : "none"}
      >
        <ViewContent />
      </Animated.View>
    );
  };

  const modalContent = (
    <View style={styles.screenContainer} pointerEvents="box-none">
      <View
        style={[styles.screenWrapper, styles.screenBackground]}
        pointerEvents="box-none"
      >
        {renderView(currentView)}
      </View>
    </View>
  );

  // Button content for BaseModal - just render the same button component
  const buttonContent = (
    <ChurchIndicatorButton
      organizationId={organizationId}
      organizationName={organizationName}
      buttonRef={React.createRef()} // Dummy ref, not used in modal
      style={{}}
      onPress={() => {}}
      onPressIn={() => {}}
      onPressOut={() => {}}
    />
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
      buttonContentPadding={0}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
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
  screenBackground: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
});
