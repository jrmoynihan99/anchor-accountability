// components/messages/MessagesList.tsx
import { ThemedText } from "@/components/ThemedText";
import React, { forwardRef, useRef } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
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
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const scrollPositionRef = useRef(0);

    const convertMessageForDisplay = (msg: any): Message => ({
      id: msg.id,
      text: msg.text,
      isFromUser: msg.senderUid === currentUserId,
      timestamp: msg.createdAt.toDate
        ? msg.createdAt.toDate()
        : new Date(msg.createdAt),
      status: "read", // For now, all messages are considered read
    });

    // Calculate input height to add bottom padding
    const inputHeight = 60 + insets.bottom;

    const handleScroll = (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      scrollPositionRef.current = contentOffset.y;

      // Check if user scrolled to top (for loading older messages)
      if (contentOffset.y <= 50 && hasMore && !loadingMore && onLoadMore) {
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
        contentContainerStyle={[
          styles.messagesContent,
          {
            paddingBottom: inputHeight + 16, // Add padding for the input + some extra space
          },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
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
                  300000); // 5 minutes

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
