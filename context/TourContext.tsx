// context/TourContext.tsx
import { TourTooltip } from "@/components/tour/TourTooltip";
import { getHasCompletedTour, setHasCompletedTour } from "@/lib/tour";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ScrollView } from "react-native";
import {
  SpotlightTourProvider,
  useSpotlightTour,
  type TourStep,
} from "react-native-spotlight-tour";

// --- Tour step content definitions (6 steps, no settings) ---

const STEP_CONTENT = [
  {
    title: "Reach Out",
    description:
      "When you're struggling, tap here to send an anonymous request for encouragement. Someone in your community will respond.",
  },
  {
    title: "Your Streak",
    description:
      "Track your daily progress here. Check in each day to build your streak and stay accountable.",
  },
  {
    title: "Support Requests",
    description:
      "See requests from others who need encouragement. Tap any request to send them a message of support.",
  },
  {
    title: "Receive Encouragements",
    description:
      "Your help requests will appear here. You can view received encouragemetns here.",
  },
  {
    title: "Private Messages",
    description:
      "Initiate a chat from a received encouragement (or vice-versa) for continued support",
  },
  {
    title: "Accountability",
    description:
      "Connect with an accountability partner for deeper support and daily check-ins.",
  },
  {
    title: "Guided Prayer",
    description:
      "Find guided prayers here for additional strength and encouragement.",
  },
  {
    title: "Community Posts",
    description: "View, create and comment on community posts.",
  },
  {
    title: "Settings",
    description:
      "Customize your experience, manage notifications, and learn more about the app.",
  },
];

const TOTAL_STEPS = STEP_CONTENT.length;

// Helper to delay for transitions
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// --- Build the steps array ---

function buildTourSteps(
  onTabNavigate: (tab: string) => void,
  homeScrollRef: React.MutableRefObject<ScrollView | null>,
  stepYPositions: React.MutableRefObject<Record<number, number>>,
): TourStep[] {
  // Scroll the home ScrollView to bring a step element into view
  const scrollToStep = async (stepIndex: number) => {
    const scrollView = homeScrollRef.current;
    const y = stepYPositions.current[stepIndex];
    if (scrollView && y !== undefined) {
      scrollView.scrollTo({ y: Math.max(0, y - 120), animated: true });
      await delay(500);
    }
  };

  // Use "fade" for steps that scroll or navigate tabs (stale coordinates make "slide" janky).
  // Use "slide" for steps on the always-visible nav bar where positions don't shift.
  const stepMotion: Record<number, "fade" | "slide"> = {
    0: "fade", // scroll on Home
    1: "slide", // scroll on Home
    2: "slide", // tab nav to Pleas
    3: "slide", // scroll on pleas to my reach outs
    4: "slide", // nav bar icon (no layout shift)
    5: "slide", // nav bar icon (no layout shift)
    6: "slide", // tab nav + scroll on Home
    7: "slide", // community card
    8: "slide", // settings button (always visible)
  };

  return STEP_CONTENT.map((content, index) => {
    const step: TourStep = {
      shape: { type: "rectangle", padding: 0 },
      motion: stepMotion[index] ?? "fade",
      onBackdropPress: "continue",
      render: (props) => (
        <TourTooltip
          {...props}
          title={content.title}
          description={content.description}
          totalSteps={TOTAL_STEPS}
        />
      ),
    };

    // Scroll to Reach Out on tour start (or backward nav from Pleas tab)
    if (index === 0) {
      step.before = async () => {
        onTabNavigate("index");
        await delay(300);
        await scrollToStep(0);
      };
    }
    // Step 1 (Streak Card): no before hook — slides directly from step 0

    // Navigate to Pleas tab for step 2
    if (index === 2) {
      step.before = async () => {
        onTabNavigate("pleas");
        await delay(500);
      };
    }

    // Navigate back to Home tab + scroll for step 5 (Guided Prayer)
    if (index === 6) {
      step.before = async () => {
        onTabNavigate("index");
        await delay(500);
        await scrollToStep(5);
      };
    }

    return step;
  });
}

// --- Context ---

interface TourContextValue {
  startTour: () => void;
  isTourActive: boolean;
  setHomeScrollRef: (ref: ScrollView | null) => void;
  registerStepY: (stepIndex: number, y: number) => void;
}

const TourContext = createContext<TourContextValue>({
  startTour: () => {},
  isTourActive: false,
  setHomeScrollRef: () => {},
  registerStepY: () => {},
});

export function useAppTour() {
  return useContext(TourContext);
}

// --- Inner component that has access to useSpotlightTour ---

function TourController({
  children,
  setHomeScrollRef,
  registerStepY,
}: {
  children: React.ReactNode;
  setHomeScrollRef: (ref: ScrollView | null) => void;
  registerStepY: (stepIndex: number, y: number) => void;
}) {
  const { start, status } = useSpotlightTour();
  const startedRef = useRef(false);

  const startTour = useCallback(() => {
    if (status === "idle") {
      start();
    }
  }, [start, status]);

  // Auto-start tour on mount if not previously completed
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    getHasCompletedTour().then((completed) => {
      if (!completed) {
        setTimeout(() => {
          start();
        }, 1000);
      }
    });
  }, [start]);

  return (
    <TourContext.Provider
      value={{
        startTour,
        isTourActive: status === "running",
        setHomeScrollRef,
        registerStepY,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

// --- Main provider ---

interface TourProviderProps {
  children: React.ReactNode;
  onTabNavigate: (tab: string) => void;
  onComplete?: () => void;
}

export function TourProvider({
  children,
  onTabNavigate,
  onComplete,
}: TourProviderProps) {
  const homeScrollRef = useRef<ScrollView | null>(null);
  const stepYPositions = useRef<Record<number, number>>({});

  const steps = useMemo(
    () => buildTourSteps(onTabNavigate, homeScrollRef, stepYPositions),
    [onTabNavigate],
  );

  const setHomeScrollRef = useCallback((ref: ScrollView | null) => {
    homeScrollRef.current = ref;
  }, []);

  const registerStepY = useCallback((stepIndex: number, y: number) => {
    stepYPositions.current[stepIndex] = y;
  }, []);

  const handleStop = useCallback(async () => {
    await setHasCompletedTour();
    // Immediately notify parent to unmount TourProvider
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <SpotlightTourProvider
      steps={steps}
      overlayColor="black"
      overlayOpacity={0.65}
      motion="fade"
      onBackdropPress="continue"
      onStop={handleStop}
      shape={{ type: "rectangle", padding: 0 }}
      offset={8}
      arrow={{ size: 14, color: "transparent" }}
    >
      <TourController
        setHomeScrollRef={setHomeScrollRef}
        registerStepY={registerStepY}
      >
        {children}
      </TourController>
    </SpotlightTourProvider>
  );
}
