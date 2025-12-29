// hooks/useThreadMessages.ts
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export interface MessageData {
  id: string;
  createdAt: Timestamp;
  senderUid: string;
  text: string;
  messageType: "text" | "system";
  readBy: string[];
}

const MESSAGES_PER_PAGE = 30;

export function useThreadMessages(threadId: string | null) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const oldestDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const listenerSetupRef = useRef(false);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Reset pagination state
    listenerSetupRef.current = false;
    oldestDocRef.current = null;
    setHasMore(true);

    // Clean up existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Set up real-time listener for most recent messages
    const messagesRef = collection(db, "threads", threadId, "messages");
    const recentMessagesQuery = query(
      messagesRef,
      orderBy("createdAt", "desc"),
      limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(
      recentMessagesQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const messagesData = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as MessageData)
          );

          // Reverse to show oldest first (normal chat order)
          const sortedMessages = messagesData.reverse();

          setMessages(sortedMessages);

          // Keep track of the oldest document for pagination
          oldestDocRef.current = snapshot.docs[snapshot.docs.length - 1];

          // Check if we have more messages to load
          setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
        } else {
          setMessages([]);
          setHasMore(false);
        }

        setError(null);
        setLoading(false);
        listenerSetupRef.current = true;
      },
      (err) => {
        console.error("Error listening to messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      listenerSetupRef.current = false;
    };
  }, [threadId]);

  // Load older messages (pagination)
  const loadMoreMessages = async () => {
    if (
      !threadId ||
      !oldestDocRef.current ||
      loadingMore ||
      !hasMore ||
      !listenerSetupRef.current
    ) {
      return;
    }

    setLoadingMore(true);

    try {
      const messagesRef = collection(db, "threads", threadId, "messages");

      const olderMessagesQuery = query(
        messagesRef,
        orderBy("createdAt", "desc"),
        startAfter(oldestDocRef.current), // ⬅️ CORRECT
        limit(MESSAGES_PER_PAGE) // ⬅️ CORRECT
      );

      const snapshot = await getDocs(olderMessagesQuery);

      if (!snapshot.empty) {
        const olderMessages = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as MessageData)
        );

        // Reverse to chronological display order
        const sortedOlderMessages = olderMessages.reverse();

        // Prepend older messages
        setMessages((prev) => [...sortedOlderMessages, ...prev]);

        // Update oldest doc
        oldestDocRef.current = snapshot.docs[snapshot.docs.length - 1];

        // More messages exist if we loaded a full page
        setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
      setError("Failed to load more messages");
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    messages,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMoreMessages,
  };
}
