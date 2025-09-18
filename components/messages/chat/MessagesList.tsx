import { ThemedText } from "@/components/ThemedText";
import { ContextCard } from "@/components/messages/chat/ContextCard";
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
  data: any[]; // Unified array: [{type: 'context'}, ...messages]
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
      data,
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
    const HEADER_HEIGHT = 60; // Match your header's height
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

    // For Android: Add padding at the top to simulate contentInset behavior
    const animatedContentStyle = useAnimatedStyle(() => {
      if (Platform.OS === "android" && keyboardHeight) {
        return {
          paddingTop: keyboardHeight.value,
        };
      }
      return {};
    });

    const handleScroll = (event: any) => {
      const { contentOffset } = event.nativeEvent;
      scrollPositionRef.current = contentOffset.y;

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
            paddingBottom: 60 + insets.bottom + 16,
            paddingTop,
          },
        ]}
      >
        {/* For Android: Add animated padding at top */}
        {Platform.OS === "android" && (
          <Animated.View style={animatedContentStyle} />
        )}

        {/* ---- Render items (context + messages) ---- */}
        {data.map((item, index) => {
          if (item.type === "context") {
            return (
              <Animated.View
                key={item.key}
                entering={FadeInDown}
                layout={LinearTransition.duration(220)}
                style={{ width: "100%" }}
              >
                <ContextCard
                  plea={item.plea}
                  encouragement={item.encouragement}
                  colors={item.colors}
                  currentUserId={item.currentUserId}
                  pleaOwnerUid={item.pleaOwnerUid}
                  encouragementOwnerUid={item.encouragementOwnerUid}
                  loading={item.loading}
                />
              </Animated.View>
            );
          }

          // Render message
          const message = convertMessageForDisplay(item);
          const showTimestamp =
            index === 1 || // context is always first, so messages start at index 1
            (data[index - 1] &&
              item.createdAt?.toMillis?.() -
                data[index - 1]?.createdAt?.toMillis?.() >
                300000);

          return (
            <Animated.View
              key={item.key}
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
        })}

        {renderLoadingHeader()}

        {data.length === 1 ? (
          <EmptyMessagesState
            isNewThread={isNewThread}
            threadName={threadName}
            colors={colors}
          />
        ) : null}
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
