// hooks/useThreadMessages.ts
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
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

export function useThreadMessages(threadId: string | null) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Clean up existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const messagesRef = collection(db, "threads", threadId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as MessageData)
        );

        setMessages(messagesData);
        setError(null);
        setLoading(false);
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
      }
    };
  }, [threadId]);

  return { messages, loading, error };
}
