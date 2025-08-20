// app/message-thread.tsx
import { MessageInput } from "@/components/messages/chat/MessageInput";
import { MessagesList } from "@/components/messages/chat/MessagesList";
import { MessageThreadHeader } from "@/components/messages/chat/MessageThreadHeader";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThreadMessages } from "@/hooks/useThreadMessages";
import {
  auth,
  createThread,
  markMessagesAsRead,
  sendMessage,
} from "@/lib/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function MessageThreadScreen() {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const params = useLocalSearchParams();

  // Get thread info from params
  const threadId = params.threadId as string;
  const threadName = params.threadName as string;
  const otherUserId = params.otherUserId as string;
  const pleaId = params.pleaId as string; // Add this line to get pleaId
  const isNewThread = params.isNewThread === "true";

  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actualThreadId, setActualThreadId] = useState<string>(threadId);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const { messages, loading, error } = useThreadMessages(actualThreadId);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Animated values for keyboard
  const keyboardHeight = useSharedValue(0);

  // Keyboard event listeners with native iOS timing
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        keyboardHeight.value = withTiming(event.endCoordinates.height, {
          duration: duration,
          // iOS keyboard uses this exact curve - verified from iOS source
          easing:
            Platform.OS === "ios"
              ? Easing.bezier(0.25, 0.1, 0.25, 1) // iOS "ease" curve
              : Easing.bezier(0.25, 0.46, 0.45, 0.94), // Android fallback
        });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        keyboardHeight.value = withTiming(0, {
          duration: duration,
          easing:
            Platform.OS === "ios"
              ? Easing.bezier(0.25, 0.1, 0.25, 1) // Same curve
              : Easing.bezier(0.25, 0.46, 0.45, 0.94), // Android fallback
        });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Animated style for input container
  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboardHeight.value * 0.9 }],
    };
  });

  // Animated style for messages container
  const animatedMessagesStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboardHeight.value * 0.9 }],
    };
  });

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
    if (!currentUserId || !isNewThread || !otherUserId) return;

    const setupNewThread = async () => {
      try {
        // Pass pleaId to createThread - it will be undefined if not provided, which is fine
        const newThreadId = await createThread(otherUserId, pleaId);
        setActualThreadId(newThreadId);
      } catch (error) {
        console.error("Failed to create thread:", error);
        Alert.alert("Error", "Failed to start conversation");
      }
    };

    setupNewThread();
  }, [currentUserId, isNewThread, otherUserId, pleaId]); // Add pleaId to dependency array

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

    // Scroll to bottom immediately
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await sendMessage(actualThreadId, messageText);
      // Remove the focus restoration - let TextInput maintain focus naturally
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
      // Restore the input text on error
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleBack = () => {
    router.back();
  };

  const handleContentSizeChange = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            Loading conversation...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
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
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      {/* Messages - Full screen behind everything with keyboard animation */}
      <Animated.View style={[styles.content, animatedMessagesStyle]}>
        <MessagesList
          ref={scrollViewRef}
          messages={messages}
          currentUserId={currentUserId}
          isNewThread={isNewThread}
          threadName={threadName}
          colors={colors}
          onContentSizeChange={handleContentSizeChange}
        />
      </Animated.View>

      {/* Floating Header */}
      <MessageThreadHeader
        threadName={threadName}
        isTyping={isTyping}
        colors={colors}
        onBack={handleBack}
        colorScheme={theme ?? "light"}
      />

      {/* Floating Input - with smooth native-like animation */}
      <Animated.View style={[styles.inputContainer, animatedInputStyle]}>
        <MessageInput
          ref={inputRef}
          inputText={inputText}
          onInputChange={setInputText}
          onSend={handleSendMessage}
          onFocus={handleInputFocus}
          colors={colors}
          disabled={sending}
          colorScheme={theme ?? "light"}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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
