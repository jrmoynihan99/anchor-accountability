// components/messages/MyReachOutModal.tsx
import { useOrganization } from "@/context/OrganizationContext";
import { useTheme } from "@/context/ThemeContext";
import { useThread } from "@/context/ThreadContext"; // Add this import
import { useUnreadCount } from "@/hooks/messages/useUnreadCount";
import { db, markEncouragementAsRead } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SharedValue } from "react-native-reanimated";
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
  progress: SharedValue<number>;
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
  const { organizationId } = useOrganization();
  const { colors, effectiveTheme } = useTheme();
  const { setCurrentPleaId } = useThread();
  const [encouragements, setEncouragements] = useState<EncouragementData[]>([]);
  const [loadingEncouragements, setLoadingEncouragements] = useState(false);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));
  const { refreshUnreadCount } = useUnreadCount();

  // Track when modal is open/closed and which plea is being viewed
  useEffect(() => {
    if (isVisible && reachOut) {
      setCurrentPleaId(reachOut.id);
    } else {
      setCurrentPleaId(null);
    }

    // Clear plea ID when component unmounts
    return () => {
      setCurrentPleaId(null);
    };
  }, [isVisible, reachOut, setCurrentPleaId]);

  // Fetch encouragements when modal opens and reachOut changes
  useEffect(() => {
    if (!isVisible || !reachOut || !organizationId) {
      setEncouragements([]);
      return;
    }

    setLoadingEncouragements(true);

    // 👈 Mark encouragements as read when modal opens
    // 👈 Mark encouragements as read and refresh unread count when modal opens
    markEncouragementAsRead(organizationId, reachOut.id)
      .then(() => refreshUnreadCount())
      .catch(console.error);

    const encouragementsQuery = query(
      collection(
        db,
        "organizations",
        organizationId,
        "pleas",
        reachOut.id,
        "encouragements"
      ),
      where("status", "==", "approved"), // ← Only approved!
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
  }, [isVisible, reachOut, organizationId]);

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
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.cardBackground}
      buttonContentPadding={20}
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
    padding: 0,
    paddingTop: 42,
    paddingBottom: 32,
  },
});
