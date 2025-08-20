// components/messages/MyReachOutModal.tsx
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { EncouragementsList } from "./EncouragementsList";
import { MyReachOutData } from "./MyReachOutCard";
import { MyReachOutCardContent } from "./MyReachOutCardContent";
import { MyReachOutModalHeader } from "./MyReachOutModalHeader";

interface EncouragementData {
  id: string;
  message: string;
  helperUid: string;
  createdAt: Date;
  openToChat?: boolean; // Changed from OpenToChat to openToChat
}

interface MyReachOutModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  reachOut: MyReachOutData | null;
  now: Date;
}

export function MyReachOutModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  reachOut,
  now,
}: MyReachOutModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const [encouragements, setEncouragements] = useState<EncouragementData[]>([]);
  const [loadingEncouragements, setLoadingEncouragements] = useState(false);

  // Fetch encouragements when modal opens and reachOut changes
  useEffect(() => {
    if (!isVisible || !reachOut) {
      setEncouragements([]);
      return;
    }

    setLoadingEncouragements(true);

    const encouragementsQuery = query(
      collection(db, "pleas", reachOut.id, "encouragements"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      encouragementsQuery,
      (snapshot) => {
        const encouragementData = snapshot.docs.map((doc) => ({
          id: doc.id,
          message: doc.data().message || "",
          helperUid: doc.data().helperUid || "",
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          openToChat: doc.data().openToChat || false, // Changed from OpenToChat to openToChat
        }));
        setEncouragements(encouragementData);
        setLoadingEncouragements(false);
      },
      (error) => {
        console.error("Error fetching encouragements:", error);
        setLoadingEncouragements(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isVisible, reachOut]);

  if (!reachOut) return null;

  // Button content (shows the reach out card in collapsed state)
  const buttonContent = <MyReachOutCardContent reachOut={reachOut} now={now} />;

  // Modal content - Much cleaner now!
  const modalContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <MyReachOutModalHeader reachOut={reachOut} now={now} colors={colors} />

      <EncouragementsList
        encouragements={encouragements}
        encouragementCount={reachOut.encouragementCount}
        now={now}
        colors={colors}
        pleaId={reachOut.id}
        onClose={close} // Add this line to pass the close function
      />
    </ScrollView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={theme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.background}
      buttonContentPadding={16}
      buttonBorderWidth={1}
      buttonBorderColor="transparent"
      buttonBorderRadius={16}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.15]}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
    paddingTop: 42,
    paddingBottom: 32,
  },
});
