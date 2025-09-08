// Updated MessagesList.tsx - Minimal changes for Android
// components/messages/MessagesList.tsx
import { ThemedText } from "@/components/ThemedText";
import React, { forwardRef, useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyMessagesState } from "./EmptyMessagesState";
import { MessageBubble } from "./MessageBubble";
import { Message } from "./types";

interface MessagesListProps {
  messages: any[];
  currentUserId: string | null;
  isNewThread: boolean;
  threadName?: string;
  colors: any;
  onContentSizeChange: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  keyboardHeight?: SharedValue<number>; // For Android contentInset simulation
}

export const MessagesList = forwardRef<ScrollView, MessagesListProps>(
  (
    {
      messages,
      currentUserId,
      isNewThread,
      threadName,
      colors,
      onContentSizeChange,
      loadingMore = false,
      hasMore = false,
      onLoadMore,
      keyboardHeight,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const HEADER_HEIGHT = 60; // Match to your header's real height
    const paddingTop = insets.top + HEADER_HEIGHT;
    const scrollPositionRef = useRef(0);

    const convertMessageForDisplay = (msg: any): Message => ({
      id: msg.id,
      text: msg.text,
      isFromUser: msg.senderUid === currentUserId,
      timestamp: msg.createdAt.toDate
        ? msg.createdAt.toDate()
        : new Date(msg.createdAt),
      status: "read",
    });

    // Calculate input height
    const inputHeight = 60 + insets.bottom;

    // For Android: Add padding at the top to simulate contentInset behavior
    const animatedContentStyle = useAnimatedStyle(() => {
      if (Platform.OS === "android" && keyboardHeight) {
        return {
          paddingTop: keyboardHeight.value, // Add scrollable space at top
        };
      }
      return {};
    });

    const handleScroll = (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      scrollPositionRef.current = contentOffset.y;

      // Adjust the threshold for Android when we have keyboard padding
      const threshold =
        Platform.OS === "android" && keyboardHeight
          ? 50 + (keyboardHeight.value || 0)
          : 50;

      if (
        contentOffset.y <= threshold &&
        hasMore &&
        !loadingMore &&
        onLoadMore
      ) {
        onLoadMore();
      }
    };

    const renderLoadingHeader = () => {
      if (!loadingMore && !hasMore) return null;

      return (
        <View style={styles.loadingHeader}>
          {loadingMore ? (
            <>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <ThemedText
                type="caption"
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading older messages...
              </ThemedText>
            </>
          ) : hasMore ? (
            <ThemedText
              type="caption"
              style={[styles.loadingText, { color: colors.textSecondary }]}
            >
              Scroll up to load older messages
            </ThemedText>
          ) : null}
        </View>
      );
    };

    return (
      <ScrollView
        ref={ref}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          styles.messagesContent,
          {
            paddingBottom: inputHeight + 16,
            paddingTop,
          },
        ]}
      >
        {/* For Android: Add animated padding at top */}
        {Platform.OS === "android" && (
          <Animated.View style={animatedContentStyle} />
        )}

        {renderLoadingHeader()}

        {messages.length === 0 ? (
          <EmptyMessagesState
            isNewThread={isNewThread}
            threadName={threadName}
            colors={colors}
          />
        ) : (
          messages.map((firebaseMessage, index) => {
            const message = convertMessageForDisplay(firebaseMessage);
            const showTimestamp =
              index === 0 ||
              (messages[index - 1] &&
                firebaseMessage.createdAt.toMillis() -
                  messages[index - 1].createdAt.toMillis() >
                  300000);

            return (
              <Animated.View
                key={message.id}
                entering={FadeInDown}
                layout={LinearTransition.duration(220)}
                style={{ width: "100%" }}
              >
                <MessageBubble
                  message={message}
                  showTimestamp={showTimestamp}
                  colors={colors}
                />
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    );
  }
);

MessagesList.displayName = "MessagesList";

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  loadingHeader: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    opacity: 0.7,
  },
});
