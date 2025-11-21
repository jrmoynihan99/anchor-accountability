// app/message-thread.tsx - FlatList Version
// PARENT COMPONENT - Nearly identical to ScrollView version

import { ContextSection } from "@/components/messages/chat/ContextSection";
import { MessageInput } from "@/components/messages/chat/MessageInput";
import { MessagesList } from "@/components/messages/chat/MessagesList";
import { MessageThreadHeader } from "@/components/messages/chat/MessageThreadHeader";
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
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Platform,
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
  const flatListRef = useRef<FlatList>(null); // Changed from ScrollView to FlatList
  const inputRef = useRef<TextInput>(null);

  // Animated values for smooth keyboard handling
  const keyboardHeight = useSharedValue(0);

  const isUserAtBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const hasInitiallyLoadedRef = useRef(false);

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

  useEffect(() => {
    if (actualThreadId) {
      setCurrentThreadId(actualThreadId);
      // Reset initial load flag when thread changes
      hasInitiallyLoadedRef.current = false;
    }
    return () => {
      setCurrentThreadId(null);
      if (actualThreadId) {
        markMessagesAsRead(actualThreadId)
          .then(() => refreshUnreadCount())
          .catch(console.error);
      }
    };
  }, [actualThreadId, setCurrentThreadId]);

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

  // Keyboard & scroll logic
  const adjustScrollViewForKeyboard = (keyboardHeight: number) => {
    // Note: For FlatList, we don't need contentInset adjustments
    // The Animated.View transform handles everything
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
    transform: [
      {
        translateY:
          Platform.OS === "ios"
            ? -keyboardHeight.value * 0.9
            : -keyboardHeight.value,
      },
    ],
  }));

  const animatedMessagesStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          Platform.OS === "ios"
            ? -keyboardHeight.value * 0.9
            : -keyboardHeight.value,
      },
    ],
  }));

  // Track scroll position to determine if user is at bottom
  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    // For inverted FlatList, contentOffset.y is negative when at bottom
    // At bottom: contentOffset.y is close to 0
    const distanceFromBottom = Math.abs(contentOffset.y);

    // Consider "at bottom" if within 50 pixels
    isUserAtBottomRef.current = distanceFromBottom < 50;
  };

  // Handle content size changes - simplified for FlatList
  const handleContentSizeChange = (
    contentWidth: number,
    contentHeight: number
  ) => {
    // On initial load, scroll to bottom (offset 0 for inverted FlatList)
    if (!hasInitiallyLoadedRef.current && messages.length > 0) {
      hasInitiallyLoadedRef.current = true;
      previousMessageCountRef.current = messages.length;
      setTimeout(() => {
        // For inverted FlatList, offset 0 is the bottom (newest message)
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);
      return;
    }

    // FlatList with maintainVisibleContentPosition handles scroll position automatically
    // when loading more messages, so we don't need manual adjustment!

    // Only auto-scroll if user is at bottom
    if (isUserAtBottomRef.current && hasInitiallyLoadedRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

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
        // For inverted FlatList, offset 0 is the bottom
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  // Only auto-scroll when user is at bottom AND it's a new message (not loading more)
  useEffect(() => {
    // Skip if not initially loaded yet
    if (!hasInitiallyLoadedRef.current) return;
    if (!isUserAtBottomRef.current) return;
    if (messages.length === 0) return;

    // Check if this is new messages being added vs loading more
    const messageDelta = messages.length - previousMessageCountRef.current;

    // Only scroll if it's likely a new message (1-5 new messages), not a batch load (>5)
    if (messageDelta > 0 && messageDelta <= 5) {
      // For inverted FlatList, offset 0 is the bottom
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }

    previousMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (actualThreadId && !isNewThread) {
      markMessagesAsRead(actualThreadId)
        .then(() => refreshUnreadCount())
        .catch(console.error);
    }
  }, [actualThreadId, isNewThread, refreshUnreadCount]);

  const handleSendMessage = async () => {
    if (inputText.trim().length === 0 || !currentUserId || sending) return;
    const messageText = inputText.trim();
    setInputText("");
    setSending(true);
    setTimeout(() => {
      // For inverted FlatList, offset 0 is the bottom
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
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
    // Always scroll to bottom when input is focused
    // For inverted FlatList, offset 0 is the bottom
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 300);
  };

  const handleLoadMore = () => {
    if (loadMoreMessages && !loadingMore) {
      loadMoreMessages();
    }
  };

  const handleBack = () => {
    router.back();
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

        {/* Header */}
        <MessageThreadHeader
          threadName={displayThreadName}
          isTyping={isTyping}
          colors={colors}
          onBack={handleBack}
          colorScheme={effectiveTheme}
          otherUserId={displayOtherUserId}
        />

        {/* Context Section - positioned absolutely */}
        <ContextSection
          plea={pleaMessage}
          encouragement={encouragementMessage}
          colors={colors}
          currentUserId={currentUserId}
          pleaOwnerUid={pleaOwnerUid}
          encouragementOwnerUid={encouragementOwnerUid}
          loading={loadingContext}
          isNewThread={isNewThread}
        />

        {/* Animated transform for message list */}
        <Animated.View style={[styles.content, animatedMessagesStyle]}>
          <MessagesList
            ref={flatListRef}
            messages={messages || []}
            currentUserId={currentUserId}
            isNewThread={isNewThread}
            threadName={displayThreadName}
            colors={colors}
            onContentSizeChange={handleContentSizeChange}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            keyboardHeight={keyboardHeight}
            onScroll={handleScroll}
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
