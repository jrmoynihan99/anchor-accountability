// components/messages/chat/MessageComposer.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

export interface MessageComposerHandle {
  setText: (text: string) => void;
  focus: () => void;
}

interface MessageComposerProps {
  onSend: (text: string) => void;
  onFocus?: () => void;
  colors: any;
  disabled?: boolean;
  onHeightChange?: (height: number) => void;
}

/**
 * Owns the draft text locally so a keystroke re-renders only this row.
 *
 * When the draft lived on the thread screen, every character re-rendered the
 * message list and the accountability modal tree. Under that load the `value`
 * prop could reach the Android EditText a keystroke behind, clobbering the
 * keyboard's in-progress composing region and duplicating characters.
 */
export const MessageComposer = forwardRef<
  MessageComposerHandle,
  MessageComposerProps
>(({ onSend, onFocus, colors, disabled = false, onHeightChange }, ref) => {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const lastReportedHeight = useRef(0);

  useImperativeHandle(ref, () => ({
    setText,
    focus: () => inputRef.current?.focus(),
  }));

  const hasText = text.trim().length > 0;
  const canSend = hasText && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const message = text.trim();
    setText("");
    onSend(message);
  };

  // Only report real height changes — the raw layout height is fractional on
  // Android and would otherwise re-render the screen on every keystroke.
  const handleLayout = (event: any) => {
    const height = Math.round(event.nativeEvent.layout.height) + 8;
    if (height === lastReportedHeight.current) return;
    lastReportedHeight.current = height;
    onHeightChange?.(height);
  };

  return (
    <View
      style={[
        styles.inputWrapper,
        {
          backgroundColor: colors.textInputBackground,
          borderColor: colors.border,
        },
      ]}
      onLayout={handleLayout}
    >
      <TextInput
        ref={inputRef}
        style={[styles.textInput, { color: colors.text }]}
        placeholder="Message..."
        placeholderTextColor={colors.textSecondary}
        value={text}
        onChangeText={setText}
        onFocus={onFocus}
        multiline
        maxLength={1000}
        submitBehavior="newline"
        disableFullscreenUI
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          { backgroundColor: hasText ? colors.tint : colors.border },
        ]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="arrow.up"
          size={16}
          color={hasText ? colors.white : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
});

MessageComposer.displayName = "MessageComposer";

const styles = StyleSheet.create({
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
