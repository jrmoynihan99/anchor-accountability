// hooks/useAccountabilityBanners.ts
import { useAccountability } from "@/context/AccountabilityContext";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

type BannerType =
  | "accepted"
  | "ended-mentor"
  | "ended-mentee"
  | "declined"
  | "received";

interface BannerState {
  showBanner: boolean;
  bannerType: BannerType;
  personName: string;
  threadId?: string;
}

export function useAccountabilityBanners() {
  const currentUid = auth.currentUser?.uid;
  const {
    mentor,
    mentees,
    recentlyEndedMentor,
    recentlyEndedMentees,
    declinedInvites,
    receivedInvites,
    loading: accountabilityLoading,
  } = useAccountability();

  const [bannerState, setBannerState] = useState<BannerState>({
    showBanner: false,
    bannerType: "accepted",
    personName: "",
    threadId: undefined,
  });

  // Refs to track previous values
  const prevMentorRef = useRef(mentor);
  const prevEndedMentorRef = useRef(recentlyEndedMentor);
  const prevEndedMenteesRef = useRef(recentlyEndedMentees);
  const prevDeclinedInvitesRef = useRef(declinedInvites);
  const prevReceivedInvitesRef = useRef(receivedInvites);

  // Helper to find threadId for a given user
  const findThreadId = async (
    otherUserId: string
  ): Promise<string | undefined> => {
    if (!currentUid) return undefined;

    try {
      const threadsAsA = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", currentUid),
          where("userB", "==", otherUserId)
        )
      );

      if (!threadsAsA.empty) {
        return threadsAsA.docs[0].id;
      }

      const threadsAsB = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", otherUserId),
          where("userB", "==", currentUid)
        )
      );

      if (!threadsAsB.empty) {
        return threadsAsB.docs[0].id;
      }

      return undefined;
    } catch (error) {
      console.error("Error finding thread:", error);
      return undefined;
    }
  };

  // Single useEffect to detect all banner conditions
  useEffect(() => {
    if (accountabilityLoading || !currentUid) return;

    // 1. Check for accepted invite (mentor appears)
    if (!prevMentorRef.current && mentor) {
      const name = `user-${mentor.mentorUid.substring(0, 5)}`;
      setBannerState({
        showBanner: true,
        bannerType: "accepted",
        personName: name,
        threadId: undefined,
      });
      prevMentorRef.current = mentor;
      return;
    }

    // 2. Check for ended mentor (recentlyEndedMentor appears)
    if (!prevEndedMentorRef.current && recentlyEndedMentor) {
      const name = `user-${recentlyEndedMentor.mentorUid.substring(0, 5)}`;
      setBannerState({
        showBanner: true,
        bannerType: "ended-mentor",
        personName: name,
        threadId: undefined,
      });
      prevEndedMentorRef.current = recentlyEndedMentor;
      return;
    }

    // 3. Check for ended mentee (recentlyEndedMentees appears)
    if (
      prevEndedMenteesRef.current.length === 0 &&
      recentlyEndedMentees.length > 0
    ) {
      const ended = recentlyEndedMentees[0];
      const name = `user-${ended.menteeUid.substring(0, 5)}`;
      setBannerState({
        showBanner: true,
        bannerType: "ended-mentee",
        personName: name,
        threadId: undefined,
      });
      prevEndedMenteesRef.current = recentlyEndedMentees;
      return;
    }

    // 4. Check for declined invite (declinedInvites appears)
    if (
      prevDeclinedInvitesRef.current.length === 0 &&
      declinedInvites.length > 0
    ) {
      const declined = declinedInvites[0];
      const name = `user-${declined.mentorUid.substring(0, 5)}`;
      // Need to find threadId for this user
      findThreadId(declined.mentorUid).then((threadId) => {
        setBannerState({
          showBanner: true,
          bannerType: "declined",
          personName: name,
          threadId,
        });
      });
      prevDeclinedInvitesRef.current = declinedInvites;
      return;
    }

    // 5. Check for received invite (receivedInvites appears)
    if (
      prevReceivedInvitesRef.current.length === 0 &&
      receivedInvites.length > 0
    ) {
      const received = receivedInvites[0];
      const name = `user-${received.menteeUid.substring(0, 5)}`;
      setBannerState({
        showBanner: true,
        bannerType: "received",
        personName: name,
        threadId: undefined,
      });
      prevReceivedInvitesRef.current = receivedInvites;
      return;
    }

    // Update all refs
    prevMentorRef.current = mentor;
    prevEndedMentorRef.current = recentlyEndedMentor;
    prevEndedMenteesRef.current = recentlyEndedMentees;
    prevDeclinedInvitesRef.current = declinedInvites;
    prevReceivedInvitesRef.current = receivedInvites;
  }, [
    mentor,
    recentlyEndedMentor,
    recentlyEndedMentees,
    declinedInvites,
    receivedInvites,
    accountabilityLoading,
    currentUid,
  ]);

  const dismissBanner = () => {
    setBannerState((prev) => ({ ...prev, showBanner: false }));
  };

  return {
    showBanner: bannerState.showBanner,
    bannerType: bannerState.bannerType,
    personName: bannerState.personName,
    threadId: bannerState.threadId,
    dismissBanner,
  };
}
