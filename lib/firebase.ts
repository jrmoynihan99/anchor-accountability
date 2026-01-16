// lib/firebase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FB_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FB_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence using dynamic import
let auth: Auth;
try {
  // Use require() to avoid TypeScript import issues
  const { getReactNativePersistence } = require("firebase/auth");

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

// ========================================
// THREAD SERVICE FUNCTIONS (NEW)
// ========================================

export interface ThreadData {
  id: string;
  userA: string; // reachOutUser
  userB: string; // helperUser
  startedFromPleaId?: string;
  startedFromEncouragementId?: string;
  createdAt: Timestamp;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderUid: string;
  };
  lastActivity: Timestamp;
  userA_unreadCount: number;
  userB_unreadCount: number;
}

// lib/firebase.ts - Updated sendMessage function

export async function sendMessage(
  organizationId: string,
  threadId: string,
  text: string
): Promise<void> {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error("User not authenticated");

  const messagesRef = collection(
    db,
    "organizations",
    organizationId,
    "threads",
    threadId,
    "messages"
  );
  const threadRef = doc(
    db,
    "organizations",
    organizationId,
    "threads",
    threadId
  );

  // Use client timestamp to avoid null issues
  const timestamp = Timestamp.now();

  // Add the message with immediate timestamp
  await addDoc(messagesRef, {
    createdAt: timestamp, // Client timestamp - no null state
    senderUid: currentUserId,
    text: text.trim(),
    messageType: "text",
    readBy: [currentUserId],
  });

  // Update thread's last message and activity
  await updateDoc(threadRef, {
    lastMessage: {
      text: text.trim(),
      timestamp: timestamp, // Same client timestamp
      senderUid: currentUserId,
    },
    lastActivity: timestamp, // Client timestamp for consistency
  });

  // Update unread counts
  const threadDoc = await getDoc(threadRef);
  if (threadDoc.exists()) {
    const threadData = threadDoc.data() as ThreadData;
    if (threadData.userA === currentUserId) {
      await updateDoc(threadRef, {
        userB_unreadCount: threadData.userB_unreadCount + 1,
      });
    } else {
      await updateDoc(threadRef, {
        userA_unreadCount: threadData.userA_unreadCount + 1,
      });
    }
  }
}

// Create a new thread
export async function createThread(
  organizationId: string,
  otherUserId: string,
  pleaId?: string,
  encouragementId?: string,
  postId?: string
): Promise<string> {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) {
    throw new Error("User not authenticated");
  }

  // Deterministic thread ID (no duplicates, order doesn't matter)
  const threadId = [currentUserId, otherUserId].sort().join("_");
  const threadRef = doc(
    db,
    "organizations",
    organizationId,
    "threads",
    threadId
  );

  // 1. Check if the thread already exists
  const threadSnap = await getDoc(threadRef);
  if (threadSnap.exists()) {
    return threadId;
  }

  // 2. If not, create new thread
  const threadData: any = {
    userA: currentUserId,
    userB: otherUserId,
    createdAt: serverTimestamp(),
    lastActivity: serverTimestamp(),
    userA_unreadCount: 0,
    userB_unreadCount: 0,
  };

  // Only add optional fields if they are defined
  if (pleaId) {
    threadData.startedFromPleaId = pleaId;
  }
  if (encouragementId) {
    threadData.startedFromEncouragementId = encouragementId;
  }
  if (postId) {
    threadData.startedFromPostId = postId;
  }

  await setDoc(threadRef, threadData);
  return threadId;
}

// Mark messages as read
export async function markMessagesAsRead(
  organizationId: string,
  threadId: string
): Promise<void> {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error("User not authenticated");

  const threadRef = doc(
    db,
    "organizations",
    organizationId,
    "threads",
    threadId
  );
  const threadDoc = await getDoc(threadRef);

  if (threadDoc.exists()) {
    const threadData = threadDoc.data() as ThreadData;

    // Reset unread count for current user
    if (threadData.userA === currentUserId) {
      await updateDoc(threadRef, {
        userA_unreadCount: 0,
      });
    } else {
      await updateDoc(threadRef, {
        userB_unreadCount: 0,
      });
    }
  }
}

// Mark encouragements as read for a plea
export async function markEncouragementAsRead(
  organizationId: string,
  pleaId: string
): Promise<void> {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) throw new Error("User not authenticated");

  const pleaRef = doc(db, "organizations", organizationId, "pleas", pleaId);

  try {
    // Reset unread count to 0 (similar to how markMessagesAsRead works)
    await updateDoc(pleaRef, {
      unreadEncouragementCount: 0,
    });
  } catch (error) {
    console.error("❌ Error marking encouragements as read:", error);
    throw error;
  }
}

export async function updateUserTimezone(): Promise<void> {
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId) return;

  try {
    // Get organizationId from custom claims
    const idTokenResult = await auth.currentUser?.getIdTokenResult();
    const organizationId =
      (idTokenResult?.claims.organizationId as string) || "public";

    const timezone = Localization.getCalendars()[0]?.timeZone ?? "Unknown";
    const userRef = doc(
      db,
      "organizations",
      organizationId,
      "users",
      currentUserId
    );

    await setDoc(
      userRef,
      {
        timezone: timezone,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to update user timezone:", error);
  }
}
