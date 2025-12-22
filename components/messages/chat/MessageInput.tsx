// components/messages/MessageInput.tsx
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import { useOtherUserAccountability } from "@/hooks/useOtherUserAccountability";
import { BlurView } from "expo-blur";
import React, { forwardRef } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenteeModal } from "../../morphing/accountability/mentee/MenteeModal";
import { MentorModal } from "../../morphing/accountability/mentor/MentorModal";
import { AccountabilityInviteButton } from "../../morphing/message-thread/accountability/AccountabilityInviteButton";
import { AccountabilityInviteModal } from "../../morphing/message-thread/accountability/AccountabilityInviteModal";
import { MessageInputProps } from "./types";

export const MessageInput = forwardRef<
  TextInput,
  MessageInputProps & {
    colorScheme?: "light" | "dark";
    otherUserId?: string;
    threadName?: string;
    onInviteModalReady?: (openFn: () => void) => void;
    onPulseReady?: (pulseFn: () => void) => void;
    relationshipType?: "mentor" | "mentee";
    relationshipData?: any;
  }
>(
  (
    {
      inputText,
      onInputChange,
      onSend,
      onFocus,
      colors,
      disabled = false,
      colorScheme = "light",
      otherUserId = "",
      threadName = "Anonymous User",
      onInviteModalReady,
      onPulseReady,
      relationshipType,
      relationshipData,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const pulseRef = React.useRef<{ pulse: () => void }>(null);

    // Get invite data from context
    const {
      sentInvites,
      receivedInvites,
      getPendingInviteWith,
      getDeclinedInviteWith, // ✅ NEW
    } = useAccountability();

    // ✅ NEW: Fetch other user's accountability data at the parent level
    const { menteeCount: otherUserMenteeCount, loading: loadingOtherUserData } =
      useOtherUserAccountability(otherUserId || null);

    // ✅ NEW: Track if declined invite has been acknowledged
    const [hasAcknowledgedDecline, setHasAcknowledgedDecline] =
      React.useState(false);

    // Determine invite state for THIS thread
    const pendingInvite = getPendingInviteWith(otherUserId);
    // I RECEIVED an invite if there's a receivedInvite where the other user is the mentee
    const isReceivedInvite = receivedInvites.some(
      (inv) => inv.menteeUid === otherUserId
    );
    // I SENT an invite if there's a sentInvite where the other user is the mentor
    const isSentInvite = sentInvites.some(
      (inv) => inv.mentorUid === otherUserId
    );

    // ✅ SIMPLIFIED: Check for declined invite (no AsyncStorage tracking needed)
    const declinedInvite = getDeclinedInviteWith(otherUserId);

    // Determine button variant based on relationship and invite state
    const getButtonVariant = ():
      | "invite"
      | "partner"
      | "pending-sent"
      | "pending-received"
      | "declined" => {
      // ✅ SIMPLIFIED: Check if declined invite exists (will be deleted on acknowledgment)
      if (declinedInvite) {
        return "declined";
      }

      if (relationshipType) return "partner";
      if (isSentInvite) return "pending-sent";
      if (isReceivedInvite) return "pending-received";
      return "invite";
    };

    const buttonVariant = getButtonVariant();

    // ------------------------------------------------------------
    // Shared inner content (used for iOS BlurView + Android solid View)
    // ------------------------------------------------------------
    const renderContent = () => (
      <View
        style={[
          styles.inputContent,
          {
            backgroundColor: colors.navBackground,
            borderTopColor: colors.navBorder,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <View style={styles.row}>
          {/* ------------------------------------------------ */}
          {/* ACCOUNTABILITY BUTTON WITH MODAL          */}
          {/* Different icon and modal based on state */}
          {/* ------------------------------------------------ */}
          <ButtonModalTransitionBridge
            buttonBorderRadius={23}
            modalBorderRadius={28}
            modalWidthPercent={relationshipType ? 0.95 : 0.9}
            modalHeightPercent={relationshipType ? 0.85 : 0.75}
            buttonFadeThreshold={0.01}
          >
            {({
              open,
              close,
              isModalVisible,
              progress,
              buttonAnimatedStyle,
              modalAnimatedStyle,
              buttonRef,
              handlePressIn,
              handlePressOut,
            }) => {
              // Expose the open function to parent component
              React.useEffect(() => {
                if (onInviteModalReady) {
                  onInviteModalReady(open);
                }
              }, [open]);

              // Expose the pulse function to parent component (only for invite state)
              React.useEffect(() => {
                if (
                  buttonVariant === "invite" &&
                  onPulseReady &&
                  pulseRef.current
                ) {
                  onPulseReady(() => pulseRef.current?.pulse());
                }
              }, [pulseRef.current, buttonVariant]);

              // One-time measurement to enable proper morph animation
              React.useEffect(() => {
                const timer = setTimeout(() => {
                  handlePressIn();
                  setTimeout(() => {
                    handlePressOut();
                  }, 10);
                }, 100);
                return () => clearTimeout(timer);
              }, []);

              // Render button based on current state
              const renderButton = () => {
                return (
                  <AccountabilityInviteButton
                    variant={buttonVariant}
                    colors={colors}
                    onPress={open}
                    buttonRef={buttonRef}
                    style={buttonAnimatedStyle}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    pulseRef={buttonVariant === "invite" ? pulseRef : undefined}
                  />
                );
              };

              // Render different modal based on relationship type or invite state
              const renderModal = () => {
                // Define custom button content for partner button - NO WRAPPER
                const partnerButtonContent = relationshipType ? (
                  <AccountabilityInviteButton
                    variant="partner"
                    colors={colors}
                  />
                ) : undefined;

                if (relationshipType === "mentor" && relationshipData) {
                  return (
                    <MentorModal
                      mentorUid={otherUserId}
                      streak={relationshipData.streak || 0}
                      checkInStatus={relationshipData.checkInStatus}
                      mentorTimezone={relationshipData.mentorTimezone}
                      relationshipId={relationshipData.id}
                      isVisible={isModalVisible}
                      progress={progress}
                      modalAnimatedStyle={modalAnimatedStyle}
                      close={close}
                      buttonContent={partnerButtonContent}
                    />
                  );
                } else if (relationshipType === "mentee" && relationshipData) {
                  return (
                    <MenteeModal
                      menteeUid={otherUserId}
                      recoveryStreak={relationshipData.streak || 0}
                      checkInStreak={45} // TODO: Get actual check-in streak
                      relationshipId={relationshipData.id}
                      isVisible={isModalVisible}
                      progress={progress}
                      modalAnimatedStyle={modalAnimatedStyle}
                      close={close}
                      buttonContent={partnerButtonContent}
                    />
                  );
                } else {
                  // Show invite modal with current state
                  return (
                    <AccountabilityInviteModal
                      isVisible={isModalVisible}
                      progress={progress}
                      modalAnimatedStyle={modalAnimatedStyle}
                      close={close}
                      otherUserId={otherUserId}
                      threadName={threadName}
                      inviteState={
                        isSentInvite
                          ? "sent"
                          : isReceivedInvite
                          ? "received"
                          : "none"
                      }
                      pendingInvite={pendingInvite}
                      otherUserMenteeCount={otherUserMenteeCount}
                      loadingOtherUserData={loadingOtherUserData}
                      buttonVariant={buttonVariant} // ✅ NEW - Pass current button state
                    />
                  );
                }
              };

              return (
                <>
                  {renderButton()}
                  {renderModal()}
                </>
              );
            }}
          </ButtonModalTransitionBridge>

          {/* ------------------------------------------------ */}
          {/* INPUT FIELD + SEND BUTTON                       */}
          {/* ------------------------------------------------ */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.textInputBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              ref={ref}
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Message..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={onInputChange}
              onFocus={onFocus}
              multiline
              maxLength={1000}
              submitBehavior="newline"
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim().length > 0 ? colors.tint : colors.border,
                },
              ]}
              onPress={onSend}
              disabled={inputText.trim().length === 0 || disabled}
              activeOpacity={0.8}
            >
              <IconSymbol
                name="arrow.up"
                size={16}
                color={
                  inputText.trim().length > 0
                    ? colors.white
                    : colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );

    return (
      <View style={styles.inputContainer}>
        {/* -------------------------------------------- */}
        {/* ANDROID fallback without blur                */}
        {/* -------------------------------------------- */}
        {Platform.OS === "android" ? (
          <View
            style={[
              styles.blurContainer,
              {
                backgroundColor:
                  Platform.OS === "android"
                    ? colors.background
                    : colors.navBackground,
              },
            ]}
          >
            {renderContent()}
          </View>
        ) : (
          <BlurView
            intensity={50}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={styles.blurContainer}
          >
            {renderContent()}
          </BlurView>
        )}
      </View>
    );
  }
);

MessageInput.displayName = "MessageInput";

const styles = StyleSheet.create({
  inputContainer: {},
  blurContainer: {
    overflow: "hidden",
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  /* New row wrapper */
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  /* Existing input wrapper (unchanged) */
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 30,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 40,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 80,
    paddingVertical: 6,
  },

  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
});
