// app/message-thread.tsx - FlatList Version with Accountability Banner
// PARENT COMPONENT

import { AccountabilityInviteBanner } from "@/components/messages/chat/AccountabilityInviteBanner";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_STORAGE_KEY = "accountabilityBannerDismissed_";
const MESSAGE_THRESHOLD = 8;

export default function MessageThreadScreen() {
  const { colors, effectiveTheme } = useTheme();
  const { setCurrentThreadId } = useThread();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

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

  // Banner state
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const inviteModalOpenRef = useRef<(() => void) | null>(null);

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
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Animated values for smooth keyboard handling
  const keyboardHeight = useSharedValue(0);

  const isUserAtBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const hasInitiallyLoadedRef = useRef(false);

  // Calculate banner top position based on context section
  const hasContext = !loadingContext && (pleaMessage || encouragementMessage);
  const HEADER_HEIGHT = 60;
  const CONTEXT_SECTION_HEIGHT = 48; // Match ContextSection HEADER_HEIGHT
  const DESIRED_GAP = 12; // Match ContextSection gap
  const bannerTopPosition = hasContext
    ? insets.top +
      HEADER_HEIGHT +
      DESIRED_GAP +
      CONTEXT_SECTION_HEIGHT +
      DESIRED_GAP
    : insets.top + HEADER_HEIGHT + DESIRED_GAP;

  // Check if banner should be shown
  useEffect(() => {
    const checkBannerStatus = async () => {
      if (!actualThreadId || !currentUserId || loadingContext) return; // Wait for context to load

      try {
        const storageKey = `${BANNER_STORAGE_KEY}${actualThreadId}`;
        const dismissed = await AsyncStorage.getItem(storageKey);

        if (!dismissed && messages.length >= MESSAGE_THRESHOLD) {
          setBannerDismissed(false);
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      } catch (error) {
        console.error("Error checking banner status:", error);
      }
    };

    checkBannerStatus();
  }, [actualThreadId, currentUserId, messages.length, loadingContext]); // Added loadingContext dependency

  const handleBannerDismiss = async () => {
    try {
      const storageKey = `${BANNER_STORAGE_KEY}${actualThreadId}`;
      await AsyncStorage.setItem(storageKey, "true");
      setBannerDismissed(true);
      setShowBanner(false);
    } catch (error) {
      console.error("Error dismissing banner:", error);
    }
  };

  const handleBannerLearnMore = () => {
    // Trigger the modal programmatically
    if (inviteModalOpenRef.current) {
      inviteModalOpenRef.current();
    }
  };

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

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const distanceFromBottom = Math.abs(contentOffset.y);
    isUserAtBottomRef.current = distanceFromBottom < 50;
  };

  const handleContentSizeChange = (
    contentWidth: number,
    contentHeight: number
  ) => {
    if (!hasInitiallyLoadedRef.current && messages.length > 0) {
      hasInitiallyLoadedRef.current = true;
      previousMessageCountRef.current = messages.length;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);
      return;
    }

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

  useEffect(() => {
    if (!hasInitiallyLoadedRef.current) return;
    if (!isUserAtBottomRef.current) return;
    if (messages.length === 0) return;

    const messageDelta = messages.length - previousMessageCountRef.current;

    if (messageDelta > 0 && messageDelta <= 5) {
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
          colorScheme={effectiveTheme}
        />

        {/* Banner positioned below ContextSection */}
        {showBanner && !bannerDismissed && (
          <View style={[styles.bannerContainer, { top: bannerTopPosition }]}>
            <AccountabilityInviteBanner
              threadName={displayThreadName}
              onLearnMore={handleBannerLearnMore}
              onDismiss={handleBannerDismiss}
              colors={colors}
              colorScheme={effectiveTheme}
            />
          </View>
        )}

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
            otherUserId={displayOtherUserId}
            threadName={displayThreadName}
            onInviteModalReady={(openFn) => {
              inviteModalOpenRef.current = openFn;
            }}
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
  bannerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 998,
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
