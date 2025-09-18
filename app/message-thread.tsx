// app/message-thread.tsx

import { MessageInput } from "@/components/messages/chat/MessageInput";
import { MessagesList } from "@/components/messages/chat/MessagesList";
import { MessageThreadHeader } from "@/components/messages/chat/MessageThreadHeader";
import { ContextCard } from "@/components/messages/chat/ContextCard";
import { ThemedText } from "@/components/ThemedText";
import { useThread } from "@/context/ThreadContext";
import { useTheme } from "@/hooks/ThemeContext";
import { useThreadMessages } from "@/hooks/useThreadMessages";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import {
  auth,
  createThread,
  db,
  markMessagesAsRead,
  sendMessage,
} from "@/lib/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function MessageThreadScreen() {
  const { colors, effectiveTheme } = useTheme();
  const { setCurrentThreadId } = useThread();
  const params = useLocalSearchParams();

  // Get thread info from params
  const threadId = params.threadId as string;
  const threadName = params.threadName as string;
  const otherUserId = params.otherUserId as string;
  const pleaId = params.pleaId as string;
  const encouragementId = params.encouragementId as string;
  const messageId = params.messageId as string;
  const isNewThread = params.isNewThread === "true";

  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actualThreadId, setActualThreadId] = useState<string>(threadId);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  // Context messages + owner UIDs
  const [pleaMessage, setPleaMessage] = useState<string | null>(null);
  const [encouragementMessage, setEncouragementMessage] = useState<
    string | null
  >(null);
  const [pleaOwnerUid, setPleaOwnerUid] = useState<string | null>(null);
  const [encouragementOwnerUid, setEncouragementOwnerUid] = useState<
    string | null
  >(null);
  const [contextPleaId, setContextPleaId] = useState<string | null>(null);
  const [contextEncouragementId, setContextEncouragementId] = useState<
    string | null
  >(null);
  const [loadingContext, setLoadingContext] = useState(true);

  // State for fetched thread data when coming from notification
  const [fetchedThreadName, setFetchedThreadName] = useState<string>("");
  const [fetchedOtherUserId, setFetchedOtherUserId] = useState<string>("");
  const [loadingThreadData, setLoadingThreadData] = useState(false);

  const { messages, loading, error, loadingMore, hasMore, loadMoreMessages } =
    useThreadMessages(actualThreadId);
  const { refreshUnreadCount } = useUnreadCount();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Animated values for smooth keyboard handling
  const keyboardHeight = useSharedValue(0);

  // 1. Resolve context IDs (from params or Firestore)
  useEffect(() => {
    let isMounted = true;
    setLoadingContext(true);
    async function resolveContextIds() {
      if (pleaId || encouragementId) {
        if (isMounted) {
          setContextPleaId(pleaId ?? null);
          setContextEncouragementId(encouragementId ?? null);
        }
        return;
      }
      if (actualThreadId) {
        const threadDoc = await getDoc(doc(db, "threads", actualThreadId));
        if (threadDoc.exists()) {
          const data = threadDoc.data();
          if (isMounted) {
            setContextPleaId(data.startedFromPleaId ?? null);
            setContextEncouragementId(data.startedFromEncouragementId ?? null);
          }
        } else if (isMounted) {
          setContextPleaId(null);
          setContextEncouragementId(null);
        }
      }
    }
    resolveContextIds().then(() => setLoadingContext(false));
    return () => {
      isMounted = false;
    };
  }, [actualThreadId, pleaId, encouragementId]);

  // 2. Fetch context messages/owners
  useEffect(() => {
    let isMounted = true;
    setLoadingContext(true);

    async function fetchContext() {
      let pleaMsg = null,
        pleaUid = null,
        encMsg = null,
        encUid = null;
      if (contextPleaId) {
        const pleaDoc = await getDoc(doc(db, "pleas", contextPleaId));
        if (pleaDoc.exists()) {
          const data = pleaDoc.data();
          pleaUid = data.uid ?? data.userId ?? null;
          pleaMsg =
            typeof data.message === "string" && data.message.trim().length > 0
              ? data.message
              : null;
        }
      }
      if (contextPleaId && contextEncouragementId) {
        const encDoc = await getDoc(
          doc(
            db,
            "pleas",
            contextPleaId,
            "encouragements",
            contextEncouragementId
          )
        );
        if (encDoc.exists()) {
          const data = encDoc.data();
          encUid = data.helperUid ?? data.userId ?? null;
          encMsg =
            typeof data.message === "string" && data.message.trim().length > 0
              ? data.message
              : null;
        }
      }
      if (isMounted) {
        setPleaOwnerUid(pleaUid);
        setPleaMessage(pleaMsg);
        setEncouragementOwnerUid(encUid);
        setEncouragementMessage(encMsg);
        setLoadingContext(false);
      }
    }
    // If no context at all, still show the card but empty.
    if (!contextPleaId) {
      setPleaOwnerUid(null);
      setPleaMessage(null);
      setEncouragementOwnerUid(null);
      setEncouragementMessage(null);
      setLoadingContext(false);
      return;
    }
    fetchContext();
    return () => {
      isMounted = false;
    };
  }, [contextPleaId, contextEncouragementId]);

  // Keyboard & scroll logic (identical to previous)
  const adjustScrollViewForKeyboard = (keyboardHeight: number) => {
    if (!scrollViewRef.current) return;
    if (Platform.OS === "ios") {
      scrollViewRef.current.setNativeProps({
        contentInset: { top: keyboardHeight, bottom: 0 },
        scrollIndicatorInsets: { top: keyboardHeight, bottom: 0 },
      });
    }
  };
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        const height = event.endCoordinates.height;
        keyboardHeight.value = withTiming(
          height,
          { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
          () => runOnJS(adjustScrollViewForKeyboard)(height)
        );
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        keyboardHeight.value = withTiming(
          0,
          { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
          () => runOnJS(adjustScrollViewForKeyboard)(0)
        );
      }
    );
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", (event) => {
      keyboardHeight.value = withTiming(
        0,
        { duration: 200, easing: Easing.out(Easing.quad) },
        () => runOnJS(adjustScrollViewForKeyboard)(0)
      );
    });
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      keyboardDidHide.remove();
    };
  }, []);
  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardHeight.value * 0.9 }],
  }));
  const animatedMessagesStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardHeight.value * 0.9 }],
  }));

  // Fetch missing thread data if coming from notification
  useEffect(() => {
    const fetchThreadData = async () => {
      if (threadName && otherUserId) return;
      if (!threadId || !currentUserId) return;
      setLoadingThreadData(true);
      try {
        const threadDoc = await getDoc(doc(db, "threads", threadId));
        if (threadDoc.exists()) {
          const threadData = threadDoc.data();
          const otherUserIdFromThread =
            threadData.userA === currentUserId
              ? threadData.userB
              : threadData.userA;
          setFetchedOtherUserId(otherUserIdFromThread);
          const userDoc = await getDoc(doc(db, "users", otherUserIdFromThread));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFetchedThreadName(
              userData.displayName ||
                `user-${otherUserIdFromThread.substring(0, 5)}`
            );
          } else {
            setFetchedThreadName(
              `user-${otherUserIdFromThread.substring(0, 5)}`
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch thread data:", error);
      } finally {
        setLoadingThreadData(false);
      }
    };
    fetchThreadData();
  }, [threadId, threadName, otherUserId, currentUserId]);
  useEffect(() => {
    if (messageId && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [messageId, messages]);
  const displayThreadName = threadName || fetchedThreadName || "Unknown User";
  const displayOtherUserId = otherUserId || fetchedOtherUserId;
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      setCurrentUserId(userId);
    } else {
      Alert.alert("Error", "User not authenticated");
      router.back();
    }
  }, []);
  useEffect(() => {
    if (!currentUserId || !isNewThread || !displayOtherUserId) return;
    const setupNewThread = async () => {
      try {
        const newThreadId = await createThread(
          displayOtherUserId,
          pleaId,
          encouragementId
        );
        setActualThreadId(newThreadId);
      } catch (error) {
        console.error("Failed to create thread:", error);
        Alert.alert("Error", "Failed to start conversation");
      }
    };
    setupNewThread();
  }, [currentUserId, isNewThread, displayOtherUserId, pleaId, encouragementId]);
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  useEffect(() => {
    if (actualThreadId && !isNewThread) {
      markMessagesAsRead(actualThreadId)
        .then(() => refreshUnreadCount())
        .catch(console.error);
    }
  }, [actualThreadId, isNewThread, refreshUnreadCount]);

  // Compose unified data array with context card at top
  const displayData = useMemo(() => {
    const contextItem = {
      type: "context",
      key: "context-card",
      loading: loadingContext,
      plea: pleaMessage,
      encouragement: encouragementMessage,
      currentUserId,
      pleaOwnerUid,
      encouragementOwnerUid,
      colors,
    };
    const messageItems = (messages || []).map((msg) => ({
      type: "message",
      ...msg,
      key: msg.id,
    }));
    return [contextItem, ...messageItems];
  }, [
    loadingContext,
    pleaMessage,
    encouragementMessage,
    currentUserId,
    pleaOwnerUid,
    encouragementOwnerUid,
    colors,
    messages,
  ]);

  const handleSendMessage = async () => {
    if (inputText.trim().length === 0 || !currentUserId || sending) return;
    const messageText = inputText.trim();
    setInputText("");
    setSending(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    try {
      await sendMessage(actualThreadId, messageText);
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContentSizeChange = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  if (loading || loadingThreadData) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
          <View style={styles.loadingContainer}>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Loading conversation...
            </ThemedText>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
          <View style={styles.loadingContainer}>
            <ThemedText type="body" style={{ color: colors.textSecondary }}>
              Error: {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.errorButton, { backgroundColor: colors.tint }]}
              onPress={handleBack}
            >
              <ThemedText type="body" style={{ color: colors.white }}>
                Go Back
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
        <MessageThreadHeader
          threadName={displayThreadName}
          isTyping={isTyping}
          colors={colors}
          onBack={handleBack}
          colorScheme={effectiveTheme}
          otherUserId={displayOtherUserId}
        />
        {/* Animated transform for message list */}
        <Animated.View style={[styles.content, animatedMessagesStyle]}>
          <MessagesList
            ref={scrollViewRef}
            data={displayData}
            currentUserId={currentUserId}
            isNewThread={isNewThread}
            threadName={displayThreadName}
            colors={colors}
            onContentSizeChange={handleContentSizeChange}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMoreMessages}
            keyboardHeight={keyboardHeight}
          />
        </Animated.View>
        {/* Animated transform for input */}
        <Animated.View style={[styles.inputContainer, animatedInputStyle]}>
          <MessageInput
            ref={inputRef}
            inputText={inputText}
            onInputChange={setInputText}
            onSend={handleSendMessage}
            onFocus={handleInputFocus}
            colors={colors}
            disabled={sending}
            colorScheme={effectiveTheme}
          />
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
});
