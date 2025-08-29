// app/message-thread.tsx - Hybrid approach with smooth keyboard animations
import { MessageInput } from "@/components/messages/chat/MessageInput";
import { MessagesList } from "@/components/messages/chat/MessagesList";
import { MessageThreadHeader } from "@/components/messages/chat/MessageThreadHeader";
import { ThemedText } from "@/components/ThemedText";
import { useThread } from "@/context/ThreadContext"; // Add this import
import { useTheme } from "@/hooks/ThemeContext";
import { useThreadMessages } from "@/hooks/useThreadMessages";
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function MessageThreadScreen() {
  const { colors, effectiveTheme } = useTheme();
  const { setCurrentThreadId } = useThread(); // Add this hook
  const params = useLocalSearchParams();

  // Get thread info from params
  const threadId = params.threadId as string;
  const threadName = params.threadName as string;
  const otherUserId = params.otherUserId as string;
  const pleaId = params.pleaId as string;
  const messageId = params.messageId as string;
  const isNewThread = params.isNewThread === "true";

  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actualThreadId, setActualThreadId] = useState<string>(threadId);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  // State for fetched thread data when coming from notification
  const [fetchedThreadName, setFetchedThreadName] = useState<string>("");
  const [fetchedOtherUserId, setFetchedOtherUserId] = useState<string>("");
  const [loadingThreadData, setLoadingThreadData] = useState(false);

  const { messages, loading, error, loadingMore, hasMore, loadMoreMessages } =
    useThreadMessages(actualThreadId);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Animated values for smooth keyboard handling
  const keyboardHeight = useSharedValue(0);

  // Set current thread when component mounts and clear when unmounting
  useEffect(() => {
    if (actualThreadId) {
      setCurrentThreadId(actualThreadId);
    }

    // Clear current thread when leaving this screen
    return () => {
      setCurrentThreadId(null);

      // Mark any remaining messages as read when leaving
      if (actualThreadId) {
        markMessagesAsRead(actualThreadId).catch(console.error);
      }
    };
  }, [actualThreadId, setCurrentThreadId]);

  // Update current thread when actualThreadId changes (for new threads)
  useEffect(() => {
    if (actualThreadId) {
      setCurrentThreadId(actualThreadId);
    }
  }, [actualThreadId, setCurrentThreadId]);

  // Keyboard event listeners with smooth animations
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        keyboardHeight.value = withTiming(event.endCoordinates.height, {
          duration: duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        keyboardHeight.value = withTiming(0, {
          duration: duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    );

    // Also listen for keyboardDidHide to catch interactive dismissal
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", (event) => {
      // Force animation to 0 if somehow missed by keyboardWillHide
      keyboardHeight.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // Animated styles for smooth transitions
  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboardHeight.value }],
    };
  });

  const animatedMessagesStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboardHeight.value }],
    };
  });

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

  // Scroll to specific message if messageId is provided
  useEffect(() => {
    if (messageId && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [messageId, messages]);

  // Use fetched data as fallback
  const displayThreadName = threadName || fetchedThreadName || "Unknown User";
  const displayOtherUserId = otherUserId || fetchedOtherUserId;

  // Get current user ID
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      setCurrentUserId(userId);
    } else {
      Alert.alert("Error", "User not authenticated");
      router.back();
    }
  }, []);

  // Set up thread for new conversations
  useEffect(() => {
    if (!currentUserId || !isNewThread || !displayOtherUserId) return;

    const setupNewThread = async () => {
      try {
        const newThreadId = await createThread(displayOtherUserId, pleaId);
        setActualThreadId(newThreadId);
      } catch (error) {
        console.error("Failed to create thread:", error);
        Alert.alert("Error", "Failed to start conversation");
      }
    };

    setupNewThread();
  }, [currentUserId, isNewThread, displayOtherUserId, pleaId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Mark messages as read when screen loads
  useEffect(() => {
    if (actualThreadId && !isNewThread) {
      markMessagesAsRead(actualThreadId).catch(console.error);
    }
  }, [actualThreadId, isNewThread]);

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
    }, 300); // Slightly longer delay to account for keyboard animation
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

        <Animated.View style={[styles.content, animatedMessagesStyle]}>
          <MessagesList
            ref={scrollViewRef}
            messages={messages}
            currentUserId={currentUserId}
            isNewThread={isNewThread}
            threadName={displayThreadName}
            colors={colors}
            onContentSizeChange={handleContentSizeChange}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMoreMessages}
          />
        </Animated.View>

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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
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
