// app/message-thread.tsx - FlatList Version with Accountability Banner
// PARENT COMPONENT

import { AccountabilityInviteBanner } from "@/components/messages/chat/AccountabilityInviteBanner";
import { AccountabilityReceivedInviteBanner } from "@/components/messages/chat/AccountabilityReceivedInviteBanner";
import { ContextSection } from "@/components/messages/chat/ContextSection";
import { MessageInput } from "@/components/messages/chat/MessageInput";
import { MessagesList } from "@/components/messages/chat/MessagesList";
import { MessageThreadHeader } from "@/components/messages/chat/MessageThreadHeader";
import { ThemedText } from "@/components/ThemedText";
import { useAccountability } from "@/context/AccountabilityContext";
import { useOrganization } from "@/context/OrganizationContext";
import { useTheme } from "@/context/ThemeContext";
import { useThread } from "@/context/ThreadContext";
import { useThreadContext } from "@/hooks/messages/useThreadContext";
import { useThreadMessages } from "@/hooks/messages/useThreadMessages";
import { useUnreadCount } from "@/hooks/messages/useUnreadCount";
import { useUserDisplayName } from "@/hooks/misc/useUserDisplayName";
import {
  auth,
  createThread,
  markMessagesAsRead,
  sendMessage,
} from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
const RECEIVED_INVITE_BANNER_STORAGE_KEY = "receivedInviteBannerDismissed_";
const MESSAGE_THRESHOLD = 8;

export default function MessageThreadScreen() {
  const { organizationId } = useOrganization();
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
  const postId = params.postId as string;
  const messageId = params.messageId as string;
  const isNewThread = params.isNewThread === "true";

  // Load accountability relationships and invites from context
  const { mentor, mentees, receivedInvites, getPendingInviteWith } =
    useAccountability();

  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actualThreadId, setActualThreadId] = useState<string>(threadId);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  // ✅ Track input height for MessagesList
  const [inputHeight, setInputHeight] = useState(60);

  // Promotional banner state
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Received invite banner state
  const [showReceivedInviteBanner, setShowReceivedInviteBanner] =
    useState(false);
  const [receivedInviteBannerDismissed, setReceivedInviteBannerDismissed] =
    useState(false);

  const inviteModalOpenRef = useRef<(() => void) | null>(null);
  const openInviteModal = params.openInviteModal === "true";

  // Pulse tracking
  const pulseFnRef = useRef<(() => void) | null>(null);
  const hasPulsedAtCountRef = useRef<Set<number>>(new Set());

  // Pulse intervals: only 3 pulses after dismissal at 23, 38, 53
  const PULSE_INTERVALS = [23, 38, 53];

  // Fetch thread context (plea/encouragement/post details)
  const {
    pleaId: contextPleaId,
    encouragementId: contextEncouragementId,
    postId: contextPostId,
    pleaMessage,
    encouragementMessage,
    postTitle,
    pleaOwnerUid,
    encouragementOwnerUid,
    postOwnerUid,
    userA,
    userB,
    loading: loadingContext,
  } = useThreadContext(actualThreadId, pleaId, encouragementId, postId);

  // State for fetched other user ID (still need this for the flow)
  const [fetchedOtherUserId, setFetchedOtherUserId] = useState<string>("");

  // Fetch other user's display name
  const { displayName: fetchedThreadName, loading: loadingThreadData } =
    useUserDisplayName(fetchedOtherUserId);

  const { messages, loading, error, loadingMore, hasMore, loadMoreMessages } =
    useThreadMessages(actualThreadId);
  const { refreshUnreadCount } = useUnreadCount();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Get the actual other user ID (from params or fetched from thread)
  const actualOtherUserId = otherUserId || fetchedOtherUserId;

  // Check if there's a received invite for this thread
  const receivedInvite = getPendingInviteWith(actualOtherUserId);
  // I RECEIVED an invite if I'm the mentor (they want me as their mentor)
  const hasReceivedInvite =
    receivedInvite &&
    receivedInvites.some((inv) => inv.menteeUid === actualOtherUserId);

  // Self-determine relationship by checking if otherUserId matches any accountability relationships
  const isMentor = React.useMemo(
    () => mentor?.mentorUid === actualOtherUserId,
    [mentor, actualOtherUserId],
  );

  const menteeRelationship = React.useMemo(
    () => mentees.find((m) => m.menteeUid === actualOtherUserId),
    [mentees, actualOtherUserId],
  );

  const isMentee = !!menteeRelationship;

  // Derive relationship type and data
  const relationshipType = isMentor
    ? "mentor"
    : isMentee
      ? "mentee"
      : undefined;
  const relationshipData = isMentor ? mentor : menteeRelationship || undefined;
  const isAccountabilityPartner = !!relationshipType;

  // Animated values for smooth keyboard handling
  const keyboardHeight = useSharedValue(0);

  const isUserAtBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const hasInitiallyLoadedRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // Calculate banner top position based on context section
  const hasContext =
    !loadingContext && (pleaMessage || encouragementMessage || postTitle);
  const HEADER_HEIGHT = 60;
  const CONTEXT_SECTION_HEIGHT = 48;
  const DESIRED_GAP = 12;
  const bannerTopPosition = hasContext
    ? insets.top +
      HEADER_HEIGHT +
      DESIRED_GAP +
      CONTEXT_SECTION_HEIGHT +
      DESIRED_GAP
    : insets.top + HEADER_HEIGHT + DESIRED_GAP;

  // Check if PROMOTIONAL banner should be shown
  useEffect(() => {
    const checkBannerStatus = async () => {
      if (!actualThreadId || !currentUserId || loadingContext) return;

      if (isAccountabilityPartner) {
        setShowBanner(false);
        setBannerDismissed(true);
        return;
      }

      if (mentor) {
        setShowBanner(false);
        setBannerDismissed(true);
        return;
      }

      if (hasReceivedInvite) {
        setShowBanner(false);
        return;
      }

      try {
        const storageKey = `${BANNER_STORAGE_KEY}${actualThreadId}`;
        const dismissed = await AsyncStorage.getItem(storageKey);

        if (dismissed) {
          setBannerDismissed(true);
          setShowBanner(false);
        } else if (messages.length >= MESSAGE_THRESHOLD) {
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
  }, [
    actualThreadId,
    currentUserId,
    messages.length,
    loadingContext,
    isAccountabilityPartner,
    mentor,
    hasReceivedInvite,
  ]);

  useEffect(() => {
    if (openInviteModal && inviteModalOpenRef.current) {
      const timer = setTimeout(() => {
        inviteModalOpenRef.current?.();

        // ✅ Clear the param from URL after opening
        router.setParams({ openInviteModal: undefined });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [openInviteModal, inviteModalOpenRef.current]);

  // Check if RECEIVED INVITE banner should be shown
  useEffect(() => {
    const checkReceivedInviteBannerStatus = async () => {
      if (!actualThreadId || !currentUserId || loadingContext) {
        return;
      }

      if (isAccountabilityPartner) {
        setShowReceivedInviteBanner(false);
        return;
      }

      if (mentor) {
        setShowReceivedInviteBanner(false);
        return;
      }

      if (!hasReceivedInvite || !receivedInvite) {
        setShowReceivedInviteBanner(false);
        return;
      }

      try {
        const storageKey = `${RECEIVED_INVITE_BANNER_STORAGE_KEY}${actualThreadId}_${receivedInvite.id}`;

        const dismissed = await AsyncStorage.getItem(storageKey);

        if (dismissed) {
          setReceivedInviteBannerDismissed(true);
          setShowReceivedInviteBanner(false);
        } else {
          setReceivedInviteBannerDismissed(false);
          setShowReceivedInviteBanner(true);
        }
      } catch (error) {
        console.error("Error checking received invite banner status:", error);
      }
    };

    checkReceivedInviteBannerStatus();
  }, [
    actualThreadId,
    currentUserId,
    loadingContext,
    isAccountabilityPartner,
    mentor,
    hasReceivedInvite,
    receivedInvite,
  ]);

  const handleBannerDismiss = async () => {
    try {
      const storageKey = `${BANNER_STORAGE_KEY}${actualThreadId}`;
      await AsyncStorage.setItem(storageKey, "true");
      setBannerDismissed(true);
      setShowBanner(false);

      if (pulseFnRef.current) {
        setTimeout(() => {
          pulseFnRef.current?.();
        }, 300);
      }
    } catch (error) {
      console.error("Error dismissing banner:", error);
    }
  };

  const handleReceivedInviteBannerDismiss = async () => {
    if (!receivedInvite) return;

    try {
      const storageKey = `${RECEIVED_INVITE_BANNER_STORAGE_KEY}${actualThreadId}_${receivedInvite.id}`;
      await AsyncStorage.setItem(storageKey, "true");
      setReceivedInviteBannerDismissed(true);
      setShowReceivedInviteBanner(false);
    } catch (error) {
      console.error("Error dismissing received invite banner:", error);
    }
  };

  const handleBannerLearnMore = () => {
    if (inviteModalOpenRef.current) {
      inviteModalOpenRef.current();
    }
  };

  const handleReceivedInviteLearnMore = () => {
    if (inviteModalOpenRef.current) {
      inviteModalOpenRef.current();
    }
  };

  useEffect(() => {
    if (!bannerDismissed) return;
    if (!pulseFnRef.current) return;
    if (hasReceivedInvite) return;

    const currentCount = messages.length;

    if (PULSE_INTERVALS.includes(currentCount)) {
      if (!hasPulsedAtCountRef.current.has(currentCount)) {
        pulseFnRef.current();
        hasPulsedAtCountRef.current.add(currentCount);
      }
    }
  }, [messages.length, bannerDismissed, hasReceivedInvite]);

  useEffect(() => {
    if (actualThreadId) {
      setCurrentThreadId(actualThreadId);
      hasInitiallyLoadedRef.current = false;
    }
    return () => {
      setCurrentThreadId(null);
      if (actualThreadId) {
        markMessagesAsRead(organizationId!, actualThreadId)
          .then(() => refreshUnreadCount())
          .catch(console.error);
      }
    };
  }, [actualThreadId, setCurrentThreadId]);

  const adjustScrollViewForKeyboard = (keyboardHeight: number) => {
    // For FlatList, we don't need contentInset adjustments
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
          () => runOnJS(adjustScrollViewForKeyboard)(height),
        );
      },
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        keyboardHeight.value = withTiming(
          0,
          { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
          () => runOnJS(adjustScrollViewForKeyboard)(0),
        );
      },
    );
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", (event) => {
      keyboardHeight.value = withTiming(
        0,
        { duration: 200, easing: Easing.out(Easing.quad) },
        () => runOnJS(adjustScrollViewForKeyboard)(0),
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
    contentHeight: number,
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

  // Derive other user ID from thread data (userA/userB from hook)
  useEffect(() => {
    if (otherUserId) {
      // Already have it from params
      setFetchedOtherUserId(otherUserId);
      return;
    }

    if (!userA || !userB || !currentUserId) {
      // Don't have thread data yet
      return;
    }

    // Derive from thread data
    const derivedOtherUserId = userA === currentUserId ? userB : userA;
    setFetchedOtherUserId(derivedOtherUserId);
  }, [otherUserId, userA, userB, currentUserId]);

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
    if (!currentUserId || !isNewThread || !displayOtherUserId || !organizationId) return;
    const setupNewThread = async () => {
      try {
        const newThreadId = await createThread(
          organizationId,
          displayOtherUserId,
          pleaId,
          encouragementId,
          postId,
        );
        setActualThreadId(newThreadId);
      } catch (error) {
        console.error("Failed to create thread:", error);
        Alert.alert("Error", "Failed to start conversation");
      }
    };
    setupNewThread();
  }, [
    currentUserId,
    isNewThread,
    displayOtherUserId,
    organizationId,
    pleaId,
    encouragementId,
    postId,
  ]);

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

  // Mark as read on thread enter
  useEffect(() => {
    if (actualThreadId && !isNewThread) {
      markMessagesAsRead(organizationId!, actualThreadId)
        .then(() => refreshUnreadCount())
        .catch(console.error);
    }
  }, [actualThreadId, isNewThread, refreshUnreadCount]);

  // Auto-mark new messages as read while viewing the thread
  useEffect(() => {
    const prevLength = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    // Only fire for new messages after initial load (skip 0 → N)
    if (prevLength > 0 && messages.length > prevLength && actualThreadId && !isNewThread) {
      markMessagesAsRead(organizationId!, actualThreadId)
        .then(() => refreshUnreadCount())
        .catch(console.error);
    }
  }, [messages.length, actualThreadId, isNewThread, refreshUnreadCount]);

  const handleSendMessage = async () => {
    if (inputText.trim().length === 0 || !currentUserId || sending) return;
    const messageText = inputText.trim();
    setInputText("");
    setSending(true);
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
    try {
      await sendMessage(organizationId!, actualThreadId, messageText);
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

        <MessageThreadHeader
          threadName={displayThreadName}
          isTyping={isTyping}
          colors={colors}
          onBack={handleBack}
          colorScheme={effectiveTheme}
          otherUserId={displayOtherUserId}
          relationshipType={relationshipType}
        />

        {!isAccountabilityPartner && (
          <ContextSection
            plea={pleaMessage}
            encouragement={encouragementMessage}
            postTitle={postTitle}
            colors={colors}
            currentUserId={currentUserId}
            pleaOwnerUid={pleaOwnerUid}
            encouragementOwnerUid={encouragementOwnerUid}
            postOwnerUid={postOwnerUid}
            loading={loadingContext}
            isNewThread={isNewThread}
            colorScheme={effectiveTheme}
          />
        )}

        {showReceivedInviteBanner && !receivedInviteBannerDismissed && (
          <View style={[styles.bannerContainer, { top: bannerTopPosition }]}>
            <AccountabilityReceivedInviteBanner
              threadName={displayThreadName}
              onLearnMore={handleReceivedInviteLearnMore}
              onDismiss={handleReceivedInviteBannerDismiss}
              colors={colors}
              colorScheme={effectiveTheme}
            />
          </View>
        )}

        {!showReceivedInviteBanner && showBanner && !bannerDismissed && (
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
            inputHeight={inputHeight}
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
            otherUserId={displayOtherUserId}
            threadName={displayThreadName}
            onInviteModalReady={(openFn) => {
              inviteModalOpenRef.current = openFn;
            }}
            onPulseReady={(pulseFn) => {
              pulseFnRef.current = pulseFn;
            }}
            relationshipType={relationshipType}
            relationshipData={relationshipData}
            onHeightChange={setInputHeight}
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
