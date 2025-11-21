// components/messages/MessagesList.tsx - FlatList Version
import { ThemedText } from "@/components/ThemedText";
import React, { forwardRef, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
  SharedValue,
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
  onContentSizeChange: (width: number, height: number) => void;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  keyboardHeight?: SharedValue<number>;
  onScroll?: (event: any) => void;
}

export const MessagesList = forwardRef<FlatList, MessagesListProps>(
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
      onScroll,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const HEADER_HEIGHT = 60;
    const paddingTop = insets.top + HEADER_HEIGHT;
    const inputHeight = 60 + insets.bottom;

    const convertMessageForDisplay = (msg: any): Message => ({
      id: msg.id,
      text: msg.text,
      isFromUser: msg.senderUid === currentUserId,
      timestamp: msg.createdAt?.toDate
        ? msg.createdAt.toDate()
        : new Date(msg.createdAt),
      status: "read",
    });

    // Dedupe and reverse messages for inverted FlatList
    // (inverted displays from bottom to top, so we reverse to get newest at bottom)
    const displayedMessages = useMemo(() => {
      const seen = new Set();
      const result: any[] = [];
      messages.forEach((m) => {
        const baseId =
          m.id ?? m.docId ?? `${m.senderUid}-${m.createdAt?.toMillis?.()}`;
        if (!seen.has(baseId)) {
          seen.add(baseId);
          result.push(m);
        }
      });
      return result.reverse(); // Reverse so newest is at bottom when inverted
    }, [messages]);

    const handleScroll = useCallback(
      (event: any) => {
        // Call parent's onScroll if provided
        if (onScroll) {
          onScroll(event);
        }
      },
      [onScroll]
    );

    // Render individual message
    const renderMessage = useCallback(
      ({ item: firebaseMessage, index }: any) => {
        const message = convertMessageForDisplay(firebaseMessage);

        const stableBaseId =
          firebaseMessage.id ??
          firebaseMessage.docId ??
          `${
            firebaseMessage.senderUid
          }-${firebaseMessage.createdAt?.toMillis?.()}`;

        const reactKey = `${stableBaseId}-${index}`;

        // Calculate if we should show timestamp
        // Since array is reversed for inverted FlatList:
        // - index 0 is newest message (at bottom)
        // - higher index is older message (towards top)
        const showTimestamp =
          index === displayedMessages.length - 1 || // Last item in array = oldest message
          (index < displayedMessages.length - 1 &&
            firebaseMessage.createdAt.toMillis() -
              displayedMessages[index + 1].createdAt.toMillis() >
              300000);

        return (
          <Animated.View
            key={reactKey}
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
      },
      [colors, currentUserId, displayedMessages]
    );

    // Extract key for each item
    const keyExtractor = useCallback((item: any, index: number) => {
      const baseId =
        item.id ??
        item.docId ??
        `${item.senderUid}-${item.createdAt?.toMillis?.()}`;
      return `${baseId}-${index}`;
    }, []);

    // Loading indicator at top (ListFooterComponent because inverted)
    const renderFooter = useCallback(() => {
      if (!loadingMore && !hasMore) return null;

      return (
        <View style={styles.loadingFooter}>
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
          ) : (
            <ThemedText
              type="caption"
              style={[styles.loadingText, { color: colors.textSecondary }]}
            >
              Scroll up to load older messages
            </ThemedText>
          )}
        </View>
      );
    }, [loadingMore, hasMore, colors]);

    // Empty state
    const renderEmpty = useCallback(() => {
      return (
        <EmptyMessagesState
          isNewThread={isNewThread}
          threadName={threadName}
          colors={colors}
        />
      );
    }, [isNewThread, threadName, colors]);

    // Handle end reached (load more)
    const handleEndReached = useCallback(() => {
      if (hasMore && !loadingMore && onLoadMore) {
        onLoadMore();
      }
    }, [hasMore, loadingMore, onLoadMore]);

    return (
      <FlatList
        ref={ref}
        data={displayedMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        inverted // Chat order: newest at bottom
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          {
            paddingTop:
              Platform.OS === "android" && keyboardHeight
                ? inputHeight + keyboardHeight.value + 16
                : inputHeight + 16,
            paddingBottom: paddingTop,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        // Performance optimizations
        removeClippedSubviews={Platform.OS === "android"}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
        windowSize={21}
      />
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
  },
  loadingFooter: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    opacity: 0.7,
  },
});
